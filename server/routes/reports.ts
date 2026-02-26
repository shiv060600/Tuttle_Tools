const express = require('express');
import { getConnection } from "../config/db";
import { Request, Response, Router } from "express";
import { IResult } from "mssql";
import { INV_ADJ_CC_IPS } from "../types";

const router: Router = express.Router();

interface ReportError {
    error: string;
    message?: string;
}

router.get("/:reportType", async(req: Request<{reportType: string}>, res: Response<INV_ADJ_CC_IPS[] | ReportError | null>)=> {
    let conn;
    
    const reportType = req.params.reportType;

    if (reportType === "INV_ADJ_CC_IPS"){
    
        try {
            conn = await getConnection();
            const result: IResult<INV_ADJ_CC_IPS> = await conn.request()
                .query(`
                    SELECT 
                        CAST(IPS.EAN AS Char(24)) AS EAN,
                        I.[DESC] as TITLE,
                        IPS.WHS,
                        IPS.Qty,
                        IPS.Acttype
                    From IPS.dbo.IPS_INV as IPS LEFT JOIN TUTLIV.dbo.ICITEM I ON TRIM(I.ITEMNO) = CAST(IPS.EAN AS Char(24))
                    WHERE WHS = 'IPS' and Acttype = 'CC'`
                );
            return res.status(200).json(result.recordset);
        } catch (error) {
            if (error instanceof Error) {
                console.error('DB error in reports get route: ', error.message);
                return res.status(500).json({
                    error: 'Failed to fetch report details',
                    message: error.message
                });
        }
    } finally {
        if (conn){
            conn.close();
        };
    }
}

});







export default router;  