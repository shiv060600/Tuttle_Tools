import express, { Request, Response, Router } from 'express';
import { Connection } from 'odbc';
import { getConnection } from '../config/db';
import { blockDuringBusinessHours } from '../middleware/timeCheck';
import {
  CustomerMapping,
  CreateMappingBody,
  UpdateMappingBody
} from '../types';

const router: Router = express.Router();

//router prefix is /mappings

// get all mappings 
router.get('/', async (req: Request, res: Response): Promise<void> => {
  let conn: Connection | null = null;
  try {
    conn = await getConnection();
    const result = await conn.query<CustomerMapping>(`
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
    res.json(result);
  } catch (err) {
    console.error('Error fetching mappings:', err);
    res.status(500).json({ error: 'Failed to fetch customer mappings' });
  } finally {
    if (conn) await conn.close();
  }
});

// create a mapping
router.post(
  '/',
  blockDuringBusinessHours,
  async (req: Request<{}, {}, CreateMappingBody>, res: Response): Promise<void> => {
    const { billto, shipto, hq, ssacct } = req.body;

    if (!billto || !hq || !ssacct) {
      res.status(400).json({ error: 'billto, hq, and ssacct are required' });
      return;
    }

    let conn: Connection | null = null;
    try {
      conn = await getConnection();
      const result = (await conn.query(
        `INSERT INTO IPS.dbo.crossref (Billto, Shipto, HQ, Ssacct) VALUES (?, ?, ?, ?)`,
        [billto, shipto ?? '', hq, ssacct]
      ));
      console.log('✅ Mapping created - BillTo:', billto, 'HQ:', hq);
      res.json({ inserted: (result as any).count });
    } catch (err) {
      console.error('Error creating mapping:', err);
      res.status(500).json({ error: 'Failed to create customer mapping' });
    } finally {
      if (conn) await conn.close();
    }
  }
);

// update a mapping
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
    const params: (string | number)[] = [];

    if (billto !== undefined) {
      updates.push('Billto = ?');
      params.push(billto);
    }
    if (shipto !== undefined) {
      updates.push('Shipto = ?');
      params.push(shipto ?? '');
    }
    if (hq !== undefined) {
      updates.push('HQ = ?');
      params.push(hq);
    }
    if (ssacct !== undefined) {
      updates.push('Ssacct = ?');
      params.push(ssacct);
    }

    if (updates.length === 0) {
      res.status(400).json({ error: 'No fields provided for update' });
      return;
    }

    params.push(rowNum);

    let conn: Connection | null = null;
    try {
      conn = await getConnection();
      const result = await conn.query(
        `UPDATE IPS.dbo.crossref SET ${updates.join(', ')} WHERE RowNum = ?`,
        params
      );

      if ((result as any).count === 0) {
        res.status(404).json({ error: `No row found with RowNum ${rowNum}` });
        return;
      }

      console.log('✅ Mapping updated - RowNum:', rowNum);
      res.json({ updated: (result as any).count });
    } catch (err) {
      console.error('Error updating mapping:', err);
      res.status(500).json({ error: 'Failed to update customer mapping' });
    } finally {
      if (conn) await conn.close();
    }
  }
);

// delete mapping
router.delete(
  '/:rowNum',
  blockDuringBusinessHours,
  async (req: Request<{ rowNum: string }>, res: Response): Promise<void> => {
    const rowNum = parseInt(req.params.rowNum, 10);
    if (isNaN(rowNum)) {
      res.status(400).json({ error: 'Invalid row number' });
      return;
    }

    let conn: Connection | null = null;
    try {
      conn = await getConnection();
      const result = await conn.query(
        `DELETE FROM IPS.dbo.crossref WHERE RowNum = ?`,
        [rowNum]
      );

      if ((result as any).count === 0) {
        res.status(404).json({ error: `No row found with RowNum ${rowNum}` });
        return;
      }

      console.log('✅ Mapping deleted - RowNum:', rowNum);
      res.json({ deleted: (result as any).count });
    } catch (err) {
      console.error('Error deleting mapping:', err);
      res.status(500).json({ error: 'Failed to delete customer mapping' });
    } finally {
      if (conn) await conn.close();
    }
  }
);

export default router;

