import { Request,Response, Router } from "express";
import { getConnection } from "../config/db";
import { requireAdmin } from "../middleware/auth";
import { CreateLoggingBody, LogDeleteResponse } from "../types";

const express = require('express');
const router: Router = express.Router();

// ============ ORIGINAL LOGGING (TuttleMappingLogger) ============
// GET /api/logging/original
router.get('/original', async(req: Request<{},{},{}>, res: Response) => {
    try{
         const pool = await getConnection();
         const result = await pool.request().query(`
            SELECT * FROM IPS.dbo.TuttleMappingLogger
         `);

         res.json(result.recordset);
    }catch(err){
        console.error(`error fetching original logs from db ${err}`);
        res.status(500).json({ error: 'Failed to fetch original logs' });
        return;
    }
});

// ============ IPS LOGGING (MappingLoggerIPS) ============
// GET /api/logging/ips
router.get('/ips', async(req: Request<{},{},{}>, res: Response) => {
    try{
         const pool = await getConnection();
         const result = await pool.request().query(`
            SELECT * FROM IPS.dbo.MappingLoggerIPS
         `);

         res.json(result.recordset);
    }catch(err){
        console.error(`error fetching IPS logs from db ${err}`);
        res.status(500).json({ error: 'Failed to fetch IPS logs' });
        return;
    }
});

// DELETE /api/logging/original/id/:logId
router.delete('/original/id/:logId', async (req: Request<{ logId: string }, {}, {}>, res: Response<LogDeleteResponse>) => {
    try {
        const pool = await getConnection();
        const { logId } = req.params;
        if (!logId) {
            res.status(400).json({ deleted_count: 0 });
            return;
        }

        const result = await pool.request()
            .input('logId', logId)
            .query(`DELETE FROM IPS.dbo.TuttleMappingLogger WHERE LOG_ID = @logId`);

        const deleted = result.rowsAffected[0] ?? 0;
        res.status(200).json({ deleted_count: deleted });
    } catch (err) {
        console.error(`error deleting original log by id ${err}`);
        res.status(500).json({ deleted_count: 0 });
        return;
    }
});

// DELETE /api/logging/original/:days
router.delete('/original/:days', async (req: Request<{ days: string }, {}, {}>, res: Response<LogDeleteResponse>) => {
    try {
        const pool = await getConnection();
        const days = Number(req.params.days);
        if (Number.isNaN(days)) {
            res.status(400).json({ deleted_count: 0 });
            return;
        }

        const result = await pool.request()
            .input('days', days)
            .query(`DELETE FROM IPS.dbo.TuttleMappingLogger WHERE DATEDIFF(day, ACTION_TIMESTAMP, GETDATE()) >= @days`);

        const deleted = result.rowsAffected[0] ?? 0;
        res.status(200).json({ deleted_count: deleted });
    } catch (err) {
        console.error(`error deleting original logs ${err}`);
        res.status(500).json({ deleted_count: 0 });
        return;
    }
});

// DELETE /api/logging/ips/id/:logId
router.delete('/ips/id/:logId', async (req: Request<{ logId: string }, {}, {}>, res: Response<LogDeleteResponse>) => {
    try {
        const pool = await getConnection();
        const { logId } = req.params;
        if (!logId) {
            res.status(400).json({ deleted_count: 0 });
            return;
        }

        const result = await pool.request()
            .input('logId', logId)
            .query(`DELETE FROM IPS.dbo.MappingLoggerIPS WHERE LOG_ID = @logId`);

        const deleted = result.rowsAffected[0] ?? 0;
        res.status(200).json({ deleted_count: deleted });
    } catch (err) {
        console.error(`error deleting IPS log by id ${err}`);
        res.status(500).json({ deleted_count: 0 });
        return;
    }
});

// DELETE /api/logging/ips/:days
router.delete('/ips/:days', async (req: Request<{ days: string }, {}, {}>, res: Response<LogDeleteResponse>) => {
    try {
        const pool = await getConnection();
        const days = Number(req.params.days);
        if (Number.isNaN(days)) {
            res.status(400).json({ deleted_count: 0 });
            return;
        }

        const result = await pool.request()
            .input('days', days)
            .query(`DELETE FROM IPS.dbo.MappingLoggerIPS WHERE DATEDIFF(day, ACTION_TIMESTAMP, GETDATE()) >= @days`);

        const deleted = result.rowsAffected[0] ?? 0;
        res.status(200).json({ deleted_count: deleted });
    } catch (err) {
        console.error(`error deleting IPS logs ${err}`);
        res.status(500).json({ deleted_count: 0 });
        return;
    }
});

// POST /api/logging/original
router.post('/original', async (req: Request<{}, {}, CreateLoggingBody>, res: Response) => {
    try {
        console.log('XX Creating original log entry:', req.body.action);
        const pool = await getConnection();

        switch (req.body.action) {
            case 'edit': {
                const rowNum = req.body.rowNum ?? null;
                if (rowNum === null || Number.isNaN(Number(rowNum))) {
                    res.status(400).json({ error: 'rowNum is required for edit' });
                    return;
                }

                await pool.request()
                    .input('billto_from', req.body.billto_from || '')
                    .input('shipto_from', req.body.shipto_from || '')
                    .input('hq_from', req.body.HQ_from || '')
                    .input('ssacct_from', req.body.Ssacct_from || '')
                    .input('billto_to', req.body.billto_to || '')
                    .input('shipto_to', req.body.shipto_to || '')
                    .input('hq_to', req.body.HQ_to || '')
                    .input('ssacct_to', req.body.Ssacct_to || '')
                    .input('rowNum', rowNum)
                    .query(`
                        INSERT INTO IPS.dbo.TuttleMappingLogger
                            (ACTION, BILLTO_FROM, SHIPTO_FROM, HQ_FROM, SSACCT_FROM, BILLTO_TO, SHIPTO_TO, HQ_TO, SSACCT_TO, ACTION_TIMESTAMP, ROWNUM)
                        VALUES ('edit', 
                            NULLIF(@billto_from, ''),
                            NULLIF(@shipto_from, ''),
                            NULLIF(@hq_from, ''),
                            NULLIF(@ssacct_from, ''),
                            NULLIF(@billto_to, ''),
                            NULLIF(@shipto_to, ''),
                            NULLIF(@hq_to, ''),
                            NULLIF(@ssacct_to, ''),
                            GETDATE(), 
                            @rowNum)
                    `);

                console.log('XX Log entry created (edit) for rowNum:', rowNum);
                res.status(200).json({ updated: 1 });
                return;
            }
            case 'insert': {
                await pool.request()
                    .input('billto_from', req.body.billto_from || '')
                    .input('shipto_from', req.body.shipto_from || '')
                    .input('hq_from', req.body.HQ_from || '')
                    .input('ssacct_from', req.body.Ssacct_from || '')
                    .input('billto_to', req.body.billto_to || '')
                    .input('shipto_to', req.body.shipto_to || '')
                    .input('hq_to', req.body.HQ_to || '')
                    .input('ssacct_to', req.body.Ssacct_to || '')
                    .input('rowNum', req.body.rowNum || 0)
                    .query(`
                        INSERT INTO IPS.dbo.TuttleMappingLogger
                            (ACTION, BILLTO_FROM, SHIPTO_FROM, HQ_FROM, SSACCT_FROM, BILLTO_TO, SHIPTO_TO, HQ_TO, SSACCT_TO, ACTION_TIMESTAMP, ROWNUM)
                        VALUES ('insert', 
                            NULLIF(@billto_from, ''),
                            NULLIF(@shipto_from, ''),
                            NULLIF(@hq_from, ''),
                            NULLIF(@ssacct_from, ''),
                            NULLIF(@billto_to, ''),
                            NULLIF(@shipto_to, ''),
                            NULLIF(@hq_to, ''),
                            NULLIF(@ssacct_to, ''),
                            GETDATE(), 
                            NULLIF(@rowNum, 0))
                    `);

                console.log('XX Log entry created (insert)');
                res.status(201).json({ inserted: 1 });
                return;
            }
            case 'delete': {
                await pool.request()
                    .input('billto_from', req.body.billto_from || '')
                    .input('shipto_from', req.body.shipto_from || '')
                    .input('hq_from', req.body.HQ_from || '')
                    .input('ssacct_from', req.body.Ssacct_from || '')
                    .input('billto_to', req.body.billto_to || '')
                    .input('shipto_to', req.body.shipto_to || '')
                    .input('hq_to', req.body.HQ_to || '')
                    .input('ssacct_to', req.body.Ssacct_to || '')
                    .input('rowNum', req.body.rowNum || 0)
                    .query(`
                        INSERT INTO IPS.dbo.TuttleMappingLogger
                            (ACTION, BILLTO_FROM, SHIPTO_FROM, HQ_FROM, SSACCT_FROM, BILLTO_TO, SHIPTO_TO, HQ_TO, SSACCT_TO, ACTION_TIMESTAMP, ROWNUM)
                        VALUES ('delete', 
                            NULLIF(@billto_from, ''),
                            NULLIF(@shipto_from, ''),
                            NULLIF(@hq_from, ''),
                            NULLIF(@ssacct_from, ''),
                            NULLIF(@billto_to, ''),
                            NULLIF(@shipto_to, ''),
                            NULLIF(@hq_to, ''),
                            NULLIF(@ssacct_to, ''),
                            GETDATE(), 
                            NULLIF(@rowNum, 0))
                    `);

                console.log('XX Log entry created (delete) for rowNum:', req.body.rowNum);
                res.status(201).json({ inserted: 1 });
                return;
            }
            default:
                console.error(`Unhandled action: ${req.body.action}`);
                res.status(400).json({ error: 'Unhandled action' });
                return;
        }
    } catch (err) {
        console.error('error posting original log to db', err);
        res.status(500).json({ error: 'Failed to post log' });
        return;
    }
});

// POST /api/logging/ips
router.post('/ips', async (req: Request<{}, {}, CreateLoggingBody>, res: Response) => {
    try {
        console.log('XX Creating IPS log entry:', req.body.action);
        const pool = await getConnection();

        switch (req.body.action) {
            case 'edit': {
                const rowNum = req.body.rowNum ?? null;
                if (rowNum === null || Number.isNaN(Number(rowNum))) {
                    res.status(400).json({ error: 'rowNum is required for edit' });
                    return;
                }

                await pool.request()
                    .input('hq_from', req.body.HQ_from || '')
                    .input('ssacct_from', req.body.Ssacct_from || '')
                    .input('hq_to', req.body.HQ_to || '')
                    .input('ssacct_to', req.body.Ssacct_to || '')
                    .input('rowNum', rowNum)
                    .query(`
                        INSERT INTO IPS.dbo.MappingLoggerIPS
                            (ACTION, HQ_FROM, SSACCT_FROM, HQ_TO, SSACCT_TO, ACTION_TIMESTAMP, ROWNUM)
                        VALUES ('edit', 
                            NULLIF(@hq_from, ''),
                            NULLIF(@ssacct_from, ''),
                            NULLIF(@hq_to, ''),
                            NULLIF(@ssacct_to, ''),
                            GETDATE(), 
                            @rowNum)
                    `);

                console.log('XX IPS log entry created (edit) for rowNum:', rowNum);
                res.status(200).json({ updated: 1 });
                return;
            }
            case 'insert': {
                await pool.request()
                    .input('hq_from', req.body.HQ_from || '')
                    .input('ssacct_from', req.body.Ssacct_from || '')
                    .input('hq_to', req.body.HQ_to || '')
                    .input('ssacct_to', req.body.Ssacct_to || '')
                    .input('rowNum', req.body.rowNum || 0)
                    .query(`
                        INSERT INTO IPS.dbo.MappingLoggerIPS
                            (ACTION, HQ_FROM, SSACCT_FROM, HQ_TO, SSACCT_TO, ACTION_TIMESTAMP, ROWNUM)
                        VALUES ('insert', 
                            NULLIF(@hq_from, ''),
                            NULLIF(@ssacct_from, ''),
                            NULLIF(@hq_to, ''),
                            NULLIF(@ssacct_to, ''),
                            GETDATE(), 
                            NULLIF(@rowNum, 0))
                    `);

                console.log('XX IPS log entry created (insert)');
                res.status(201).json({ inserted: 1 });
                return;
            }
            case 'delete': {
                await pool.request()
                    .input('hq_from', req.body.HQ_from || '')
                    .input('ssacct_from', req.body.Ssacct_from || '')
                    .input('hq_to', req.body.HQ_to || '')
                    .input('ssacct_to', req.body.Ssacct_to || '')
                    .input('rowNum', req.body.rowNum || 0)
                    .query(`
                        INSERT INTO IPS.dbo.MappingLoggerIPS
                            (ACTION, HQ_FROM, SSACCT_FROM, HQ_TO, SSACCT_TO, ACTION_TIMESTAMP, ROWNUM)
                        VALUES ('delete', 
                            NULLIF(@hq_from, ''),
                            NULLIF(@ssacct_from, ''),
                            NULLIF(@hq_to, ''),
                            NULLIF(@ssacct_to, ''),
                            GETDATE(), 
                            NULLIF(@rowNum, 0))
                    `);

                console.log('XX IPS log entry created (delete) for rowNum:', req.body.rowNum);
                res.status(201).json({ inserted: 1 });
                return;
            }
            default:
                console.error(`Unhandled action: ${req.body.action}`);
                res.status(400).json({ error: 'Unhandled action' });
                return;
        }
    } catch (err) {
        console.error('error posting IPS log to db', err);
        res.status(500).json({ error: 'Failed to post log' });
        return;
    }
});

export default router;
