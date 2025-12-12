import { Request,Response } from "express";
import { getConnection } from "../config/db";
import odbc, { Connection } from "odbc";
import { CreateLoggingBody, LogDeleteResponse } from "../types";

const express = require('express');
const router = express.Router();


//logs router prefix : /logging

//get all logs
router.get('/', async(req: Request<{},{},{}>, res: Response) => {
    
    let conn : Connection | undefined | null;
    try{
         conn = await getConnection();
         const query = (
            `
            SELECT * FROM IPS.dbo.TuttleMappingLogger
            `
         );

         const result = await conn.query(query);

         res.json(result);
    }catch(err){
        console.error(`error fetching logs from db ${err}`);
        throw new Error(`error fetching logs from db ${err}`);
    }finally{
        if(conn){
            conn.close();
        }
    }

});

//delete logs for the amount of days
router.delete('/:days', async (req: Request<{ days: string }, {}, {}>, res: Response<LogDeleteResponse>) => {
    let conn: odbc.Connection | null = null;
    try {
        conn = await getConnection();
        const days = Number(req.params.days);
        if (Number.isNaN(days)) {
            return res.status(400).json({ deleted_count: 0 });
        }

        const query = `
            DELETE FROM IPS.dbo.TuttleMappingLogger
            WHERE DATEDIFF(day, ACTION_TIMESTAMP, GETDATE()) >= ?
        `;

        const result = await conn.query(query, [days]);
        const deleted = result.count ?? 0;
        res.status(200).json({ deleted_count: deleted });
    } catch (err) {
        console.error(`error deleting logs ${err}`);
        res.status(500).json({ deleted_count: 0 });
    } finally {
        if (conn) {
            await conn.close();
        }
    }
});

//post an action to logging table
router.post('/', async (req: Request<{}, {}, CreateLoggingBody>, res: Response) => {
    let conn: odbc.Connection | null = null;
    try {
        conn = await getConnection();

        switch (req.body.action) {
            case 'edit': {
                const rowNum = req.body.rowNum ?? null;
                if (rowNum === null || Number.isNaN(Number(rowNum))) {
                    return res.status(400).json({ error: 'rowNum is required for edit' });
                }

                const query = `
                    UPDATE IPS.dbo.TuttleMappingLogger
                    SET 
                        ACTION = 'edit',
                        BILLTO_FROM = ?,
                        SHIPTO_FROM = ?,
                        HQ_FROM = ?,
                        SSACCT_FROM = ?,
                        BILLTO_TO = ?,
                        SHIPTO_TO = ?,
                        HQ_TO = ?,
                        SSACCT_TO = ?,
                        ACTION_TIMESTAMP = ?
                    WHERE ROWNUM = ?
                `;

                const params = [
                    req.body.billto_from!,
                    req.body.shipto_from!,
                    req.body.HQ_from!,
                    req.body.Ssacct_from!,
                    req.body.billto_to!,
                    req.body.shipto_to!,
                    req.body.HQ_to!,
                    req.body.Ssacct_to!,
                    req.body.ACTION_TIMESTAMP!,
                    rowNum!,
                ];

                await conn.query(query, params);
                return res.status(200).json({ updated: 1 });
            }

            default:
                console.error(`Unhandled action: ${req.body.action}`);
                return res.status(400).json({ error: 'Unhandled action' });
        }
    } catch (err) {
        console.error('error posting a log to db', err);
        return res.status(500).json({ error: 'Failed to post log' });
    } finally {
        if (conn) {
            await conn.close();
        }
    }
});
