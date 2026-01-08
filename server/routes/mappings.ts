import express, { Request, Response, Router } from 'express';
import { getConnection } from '../config/db';
import { blockDuringBusinessHours } from '../middleware/timeCheck';
import { requireAdmin } from '../middleware/auth';
import {
  CustomerMapping,
  CreateMappingBody,
  UpdateMappingBody
} from '../types';

const router: Router = express.Router();

// ============ ORIGINAL MAPPINGS (crossref table) ============
// GET /api/mappings/original
router.get('/original', async (req: Request, res: Response) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query<CustomerMapping>(`
      SELECT 
        c.RowNum as rowNum,
        c.Billto as billto,
        c.Shipto as shipto,
        c.HQ as hq,
        c.Ssacct as ssacct,
        a.NAMECUST as nameCust
      FROM 
        IPS.dbo.crossref as c 
        LEFT JOIN TUTLIV.dbo.ARCUS as a ON c.Ssacct = a.IDCUST
    `);
    console.log('XX Fetched original mappings - Count:', result.recordset.length);
    return res.status(200).json(result.recordset);
  } catch (err) {
    console.error('XX Error fetching original mappings:', err);
    return res.status(500).json({ error: 'Failed to fetch original mappings' });
  }
});

// POST /api/mappings/original
router.post(
  '/original',
  blockDuringBusinessHours,
  async (req: Request<{}, {}, CreateMappingBody>, res: Response) => {
    const { billto, shipto, hq, ssacct } = req.body;

    if (!billto || !hq || !ssacct) {
      console.log('XX Original mapping creation failed - Missing required fields');
      return res.status(400).json({ error: 'billto, hq, and ssacct are required' });
    }

    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('billto', billto)
        .input('shipto', shipto ?? '')
        .input('hq', hq)
        .input('ssacct', ssacct)
        .query(`INSERT INTO IPS.dbo.crossref (Billto, Shipto, HQ, Ssacct) VALUES (@billto, @shipto, @hq, @ssacct)`);
      console.log('XX Original mapping created - BillTo:', billto, 'ShipTo:', shipto, 'HQ:', hq, 'SSAcct:', ssacct);
      return res.status(200).json({ inserted: result.rowsAffected[0] });
    } catch (err) {
      console.error('XX Error creating original mapping:', err);
      return res.status(500).json({ error: 'Failed to create original mapping' });
    }
  }
);

// PUT /api/mappings/original/:rowNum
router.put(
  '/original/:rowNum',
  blockDuringBusinessHours,
  async (req: Request<{ rowNum: string }, {}, UpdateMappingBody>, res: Response) => {
    const rowNum = parseInt(req.params.rowNum, 10);
    if (isNaN(rowNum)) {
      console.log('XX Original mapping update failed - Invalid row number:', req.params.rowNum);
      return res.status(400).json({ error: 'Invalid row number' });
    }

    const { billto, shipto, hq, ssacct } = req.body;

    const updates: string[] = [];
    const pool = await getConnection();
    const request = pool.request();

    if (billto !== undefined) {
      updates.push('Billto = @billto');
      request.input('billto', billto);
    }
    if (shipto !== undefined) {
      updates.push('Shipto = @shipto');
      request.input('shipto', shipto ?? '');
    }
    if (hq !== undefined) {
      updates.push('HQ = @hq');
      request.input('hq', hq);
    }
    if (ssacct !== undefined) {
      updates.push('Ssacct = @ssacct');
      request.input('ssacct', ssacct);
    }

    if (updates.length === 0) {
      console.log('XX Original mapping update failed - No fields provided for RowNum:', rowNum);
      return res.status(400).json({ error: 'No fields provided for update' });
    }

    request.input('rowNum', rowNum);

    try {
      const result = await request.query(
        `UPDATE IPS.dbo.crossref SET ${updates.join(', ')} WHERE RowNum = @rowNum`
      );

      if (result.rowsAffected[0] === 0) {
        console.log('XX Original mapping update failed - Row not found:', rowNum);
        return res.status(404).json({ error: `No row found with RowNum ${rowNum}` });
      }

      console.log('XX Original mapping updated - RowNum:', rowNum, 'Fields:', updates.join(', '));
      return res.status(200).json({ updated: result.rowsAffected[0] });
    } catch (err) {
      console.error('XX Error updating original mapping - RowNum:', rowNum, err);
      return res.status(500).json({ error: 'Failed to update original mapping' });
    }
  }
);

// DELETE /api/mappings/original/:rowNum
router.delete(
  '/original/:rowNum',
  blockDuringBusinessHours,
  async (req: Request<{ rowNum: string }>, res: Response) => {
    const rowNum = parseInt(req.params.rowNum, 10);
    if (isNaN(rowNum)) {
      console.log('XX Original mapping deletion failed - Invalid row number:', req.params.rowNum);
      return res.status(400).json({ error: 'Invalid row number' });
    }

    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('rowNum', rowNum)
        .query(`DELETE FROM IPS.dbo.crossref WHERE RowNum = @rowNum`);

      if (result.rowsAffected[0] === 0) {
        console.log('XX Original mapping deletion failed - Row not found:', rowNum);
        return res.status(404).json({ error: `No row found with RowNum ${rowNum}` });
      }

      console.log('XX Original mapping deleted - RowNum:', rowNum);
      return res.status(200).json({ deleted: result.rowsAffected[0] });
    } catch (err) {
      console.error('XX Error deleting original mapping - RowNum:', rowNum, err);
      return res.status(500).json({ error: 'Failed to delete original mapping' });
    }
  }
);

// ============ IPS MAPPINGS (ips_mapping table) ============
// GET /api/mappings/ips
router.get('/ips', async (req: Request, res: Response) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT 
        i.rownum as rowNum,
        i.hq as hq,
        i.ssacct as ssacct,
        a.NAMECUST as nameCust
      FROM 
        IPS.dbo.ips_mapping as i 
        LEFT JOIN TUTLIV.dbo.ARCUS as a ON i.ssacct = a.IDCUST
      ORDER BY i.rownum
    `);
    console.log('XX Fetched IPS mappings - Count:', result.recordset.length);
    return res.status(200).json(result.recordset);
  } catch (err) {
    console.error('XX Error fetching IPS mappings:', err);
    return res.status(500).json({ error: 'Failed to fetch IPS mappings' });
  }
});

// POST /api/mappings/ips
router.post(
  '/ips',
  requireAdmin,
  blockDuringBusinessHours,
  async (req: Request<{}, {}, { hq: string; ssacct: string }>, res: Response) => {
    const { hq, ssacct } = req.body;

    if (!hq || !ssacct) {
      console.log('XX IPS mapping creation failed - Missing required fields');
      return res.status(400).json({ error: 'hq and ssacct are required' });
    }

    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('hq', hq)
        .input('ssacct', ssacct)
        .query(`INSERT INTO IPS.dbo.ips_mapping (hq, ssacct) VALUES (@hq, @ssacct)`);
      console.log('XX IPS mapping created - HQ:', hq, 'SSAcct:', ssacct);
      return res.status(200).json({ inserted: result.rowsAffected[0] });
    } catch (err) {
      console.error('XX Error creating IPS mapping:', err);
      return res.status(500).json({ error: 'Failed to create IPS mapping' });
    }
  }
);

// PUT /api/mappings/ips/:rowNum
router.put(
  '/ips/:rowNum',
  requireAdmin,
  blockDuringBusinessHours,
  async (req: Request<{ rowNum: string }, {}, { hq?: string; ssacct?: string }>, res: Response) => {
    const rowNum = parseInt(req.params.rowNum, 10);
    if (isNaN(rowNum)) {
      console.log('XX IPS mapping update failed - Invalid row number:', req.params.rowNum);
      return res.status(400).json({ error: 'Invalid row number' });
    }

    const { hq, ssacct } = req.body;

    const updates: string[] = [];
    const pool = await getConnection();
    const request = pool.request();

    if (hq !== undefined) {
      updates.push('hq = @hq');
      request.input('hq', hq);
    }
    if (ssacct !== undefined) {
      updates.push('ssacct = @ssacct');
      request.input('ssacct', ssacct);
    }

    if (updates.length === 0) {
      console.log('XX IPS mapping update failed - No fields provided for RowNum:', rowNum);
      return res.status(400).json({ error: 'No fields provided for update' });
    }

    request.input('rowNum', rowNum);

    try {
      const result = await request.query(
        `UPDATE IPS.dbo.ips_mapping SET ${updates.join(', ')} WHERE rownum = @rowNum`
      );

      if (result.rowsAffected[0] === 0) {
        console.log('XX IPS mapping update failed - Row not found:', rowNum);
        return res.status(404).json({ error: `No row found with rownum ${rowNum}` });
      }

      console.log('XX IPS mapping updated - RowNum:', rowNum, 'Fields:', updates.join(', '));
      return res.status(200).json({ updated: result.rowsAffected[0] });
    } catch (err) {
      console.error('XX Error updating IPS mapping - RowNum:', rowNum, err);
      return res.status(500).json({ error: 'Failed to update IPS mapping' });
    }
  }
);

// DELETE /api/mappings/ips/:rowNum
router.delete(
  '/ips/:rowNum',
  requireAdmin,
  blockDuringBusinessHours,
  async (req: Request<{ rowNum: string }>, res: Response) => {
    const rowNum = parseInt(req.params.rowNum, 10);
    if (isNaN(rowNum)) {
      console.log('XX IPS mapping deletion failed - Invalid row number:', req.params.rowNum);
      return res.status(400).json({ error: 'Invalid row number' });
    }

    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('rowNum', rowNum)
        .query(`DELETE FROM IPS.dbo.ips_mapping WHERE rownum = @rowNum`);

      if (result.rowsAffected[0] === 0) {
        console.log('XX IPS mapping deletion failed - Row not found:', rowNum);
        return res.status(404).json({ error: `No row found with rownum ${rowNum}` });
      }

      console.log('XX IPS mapping deleted - RowNum:', rowNum);
      return res.status(200).json({ deleted: result.rowsAffected[0] });
    } catch (err) {
      console.error('XX Error deleting IPS mapping - RowNum:', rowNum, err);
      return res.status(500).json({ error: 'Failed to delete IPS mapping' });
    }
  }
);

export default router;

