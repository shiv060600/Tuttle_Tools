import { Request,Response, Router } from "express";
import { getConnection } from "../config/db";
import { CreateLoggingBody, LogDeleteResponse } from "../types";

const express = require('express');
const router: Router = express.Router();
//route is /api/logging
router.get('/', async(req: Request<{},{},{}>, res: Response) => {
    try{
         const pool = await getConnection();
         const result = await pool.request().query(`
            SELECT * FROM IPS.dbo.TuttleMappingLogger
         `);

         res.json(result.recordset);
    }catch(err){
        console.error(`error fetching logs from db ${err}`);
        throw new Error(`error fetching logs from db ${err}`);
    }
});

router.delete('/id/:logId', async (req: Request<{ logId: string }, {}, {}>, res: Response<LogDeleteResponse>) => {
    try {
        const pool = await getConnection();
        const { logId } = req.params;
        if (!logId) {
            return res.status(400).json({ deleted_count: 0 });
        }

        const result = await pool.request()
            .input('logId', logId)
            .query(`DELETE FROM IPS.dbo.TuttleMappingLogger WHERE LOG_ID = @logId`);

        const deleted = result.rowsAffected[0] ?? 0;
        return res.status(200).json({ deleted_count: deleted });
    } catch (err) {
        console.error(`error deleting log by id ${err}`);
        return res.status(500).json({ deleted_count: 0 });
    }
});

router.delete('/:days', async (req: Request<{ days: string }, {}, {}>, res: Response<LogDeleteResponse>) => {
    try {
        const pool = await getConnection();
        const days = Number(req.params.days);
        if (Number.isNaN(days)) {
            return res.status(400).json({ deleted_count: 0 });
        }

        const result = await pool.request()
            .input('days', days)
            .query(`DELETE FROM IPS.dbo.TuttleMappingLogger WHERE DATEDIFF(day, ACTION_TIMESTAMP, GETDATE()) >= @days`);

        const deleted = result.rowsAffected[0] ?? 0;
        res.status(200).json({ deleted_count: deleted });
    } catch (err) {
        console.error(`error deleting logs ${err}`);
        res.status(500).json({ deleted_count: 0 });
    }
});

router.post('/', async (req: Request<{}, {}, CreateLoggingBody>, res: Response) => {
    try {
        console.log('📝 Creating log entry:', req.body.action);
        const pool = await getConnection();

        switch (req.body.action) {
            case 'edit': {
                const rowNum = req.body.rowNum ?? null;
                if (rowNum === null || Number.isNaN(Number(rowNum))) {
                    return res.status(400).json({ error: 'rowNum is required for edit' });
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

                console.log(' Log entry created (edit) for rowNum:', rowNum);
                return res.status(200).json({ updated: 1 });
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

                console.log(' Log entry created (insert)');
                return res.status(201).json({ inserted: 1 });
            }
            case 'delete':
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

                res.status(201).json({inserted: 1})

            default:
                console.error(`Unhandled action: ${req.body.action}`);
                return res.status(400).json({ error: 'Unhandled action' });
        }
    } catch (err) {
        console.error('error posting a log to db', err);
        return res.status(500).json({ error: 'Failed to post log' });
    }
});

export default router;
