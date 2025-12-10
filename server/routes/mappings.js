const express = require('express');
const router = express.Router();
const { getConnection } = require('../config/db');
const { blockDuringBusinessHours } = require('../middleware/timeCheck');

// ============ GET ALL MAPPINGS ============
router.get('/', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.query(`
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

// ============ CREATE MAPPING ============
router.post('/', blockDuringBusinessHours, async (req, res) => {
  const { billto, shipto, hq, ssacct } = req.body;

  if (!billto || !hq || !ssacct) {
    return res.status(400).json({ error: 'billto, hq, and ssacct are required' });
  }

  let conn;
  try {
    conn = await getConnection();
    const result = await conn.query(
      `INSERT INTO IPS.dbo.crossref (Billto, Shipto, HQ, Ssacct) VALUES (?, ?, ?, ?)`,
      [billto, shipto ?? '', hq, ssacct]
    );
    res.json({ inserted: result.count });
  } catch (err) {
    console.error('Error creating mapping:', err);
    res.status(500).json({ error: 'Failed to create customer mapping' });
  } finally {
    if (conn) await conn.close();
  }
});

// ============ UPDATE MAPPING ============
router.put('/:rowNum', blockDuringBusinessHours, async (req, res) => {
  const rowNum = parseInt(req.params.rowNum, 10);
  if (isNaN(rowNum)) {
    return res.status(400).json({ error: 'Invalid row number' });
  }

  const { billto, shipto, hq, ssacct } = req.body;

  const updates = [];
  const params = [];

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
    return res.status(400).json({ error: 'No fields provided for update' });
  }

  params.push(rowNum);

  let conn;
  try {
    conn = await getConnection();
    const result = await conn.query(
      `UPDATE IPS.dbo.crossref SET ${updates.join(', ')} WHERE RowNum = ?`,
      params
    );

    if (result.count === 0) {
      return res.status(404).json({ error: `No row found with RowNum ${rowNum}` });
    }

    res.json({ updated: result.count });
  } catch (err) {
    console.error('Error updating mapping:', err);
    res.status(500).json({ error: 'Failed to update customer mapping' });
  } finally {
    if (conn) await conn.close();
  }
});

// ============ DELETE MAPPING ============
router.delete('/:rowNum', blockDuringBusinessHours, async (req, res) => {
  const rowNum = parseInt(req.params.rowNum, 10);
  if (isNaN(rowNum)) {
    return res.status(400).json({ error: 'Invalid row number' });
  }

  let conn;
  try {
    conn = await getConnection();
    const result = await conn.query(
      `DELETE FROM IPS.dbo.crossref WHERE RowNum = ?`,
      [rowNum]
    );

    if (result.count === 0) {
      return res.status(404).json({ error: `No row found with RowNum ${rowNum}` });
    }

    res.json({ deleted: result.count });
  } catch (err) {
    console.error('Error deleting mapping:', err);
    res.status(500).json({ error: 'Failed to delete customer mapping' });
  } finally {
    if (conn) await conn.close();
  }
});

module.exports = router;

