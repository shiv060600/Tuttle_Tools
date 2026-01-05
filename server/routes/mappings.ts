import express, { Request, Response, Router } from 'express';
import { getConnection } from '../config/db';
import { blockDuringBusinessHours } from '../middleware/timeCheck';
import {
  CustomerMapping,
  CreateMappingBody,
  UpdateMappingBody
} from '../types';

const router: Router = express.Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
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
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching mappings:', err);
    res.status(500).json({ error: 'Failed to fetch customer mappings' });
  }
});

router.post(
  '/',
  blockDuringBusinessHours,
  async (req: Request<{}, {}, CreateMappingBody>, res: Response): Promise<void> => {
    const { billto, shipto, hq, ssacct } = req.body;

    if (!billto || !hq || !ssacct) {
      res.status(400).json({ error: 'billto, hq, and ssacct are required' });
      return;
    }

    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('billto', billto)
        .input('shipto', shipto ?? '')
        .input('hq', hq)
        .input('ssacct', ssacct)
        .query(`INSERT INTO IPS.dbo.crossref (Billto, Shipto, HQ, Ssacct) VALUES (@billto, @shipto, @hq, @ssacct)`);
      console.log('✅ Mapping created - BillTo:', billto, 'HQ:', hq);
      res.json({ inserted: result.rowsAffected[0] });
    } catch (err) {
      console.error('Error creating mapping:', err);
      res.status(500).json({ error: 'Failed to create customer mapping' });
    }
  }
);

router.put(
  '/:rowNum',
  blockDuringBusinessHours,
  async (req: Request<{ rowNum: string }, {}, UpdateMappingBody>, res: Response): Promise<void> => {
    const rowNum = parseInt(req.params.rowNum, 10);
    if (isNaN(rowNum)) {
      res.status(400).json({ error: 'Invalid row number' });
      return;
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
      res.status(400).json({ error: 'No fields provided for update' });
      return;
    }

    request.input('rowNum', rowNum);

    try {
      const result = await request.query(
        `UPDATE IPS.dbo.crossref SET ${updates.join(', ')} WHERE RowNum = @rowNum`
      );

      if (result.rowsAffected[0] === 0) {
        res.status(404).json({ error: `No row found with RowNum ${rowNum}` });
        return;
      }

      console.log('✅ Mapping updated - RowNum:', rowNum);
      res.json({ updated: result.rowsAffected[0] });
    } catch (err) {
      console.error('Error updating mapping:', err);
      res.status(500).json({ error: 'Failed to update customer mapping' });
    }
  }
);

router.delete(
  '/:rowNum',
  blockDuringBusinessHours,
  async (req: Request<{ rowNum: string }>, res: Response): Promise<void> => {
    const rowNum = parseInt(req.params.rowNum, 10);
    if (isNaN(rowNum)) {
      res.status(400).json({ error: 'Invalid row number' });
      return;
    }

    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('rowNum', rowNum)
        .query(`DELETE FROM IPS.dbo.crossref WHERE RowNum = @rowNum`);

      if (result.rowsAffected[0] === 0) {
        res.status(404).json({ error: `No row found with RowNum ${rowNum}` });
        return;
      }

      console.log('✅ Mapping deleted - RowNum:', rowNum);
      res.json({ deleted: result.rowsAffected[0] });
    } catch (err) {
      console.error('Error deleting mapping:', err);
      res.status(500).json({ error: 'Failed to delete customer mapping' });
    }
  }
);

export default router;

