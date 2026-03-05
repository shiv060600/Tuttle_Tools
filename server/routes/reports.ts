const express = require('express');
import { getConnection } from "../config/db";
import { Request, Response, Router } from "express";
import { IResult } from "mssql";
import { INV_ADJ_CC_IPS, INV_ADJ_OH_ING } from "../types";

const router: Router = express.Router();

interface ReportError {
    error: string;
    message?: string;
}
interface AvailableReportsResponse {
    INV_ADJ_CC_ING: boolean;
    INV_ADJ_CC_IPS: boolean;
    INV_ADJ_OH_IPS: boolean;
    INV_ADJ_OH_ING: boolean;
    INV_RR: boolean;
    INV_TI: boolean;
    ADJ_S_R: boolean;
}
//base is /api/reports

router.get("/available", async (req:Request, res: Response<AvailableReportsResponse | ReportError>) =>  {
    let conn;
    try {
        const response: AvailableReportsResponse = {
            INV_ADJ_CC_ING: false,
            INV_ADJ_CC_IPS: false,
            INV_ADJ_OH_IPS: false,
            INV_ADJ_OH_ING: false,
            INV_RR: false,
            INV_TI: false,
            ADJ_S_R: false
        };

        conn = await getConnection();
        const result: IResult<string[]> = await conn.request()
            .query(
                `
                SELECT TRIM(CAST(ReportName as VARCHAR(50))) as ReportName FROM IPS.dbo.REPORTS WHERE DATA = 'X'
                `)
        
        const availableReportNames = result.recordset;

        availableReportNames.forEach((reportName: string) => {response[reportName as keyof AvailableReportsResponse] = true});

        return res.status(200).json(response);

    } catch (error) {
        if (error instanceof Error) {
            console.error('Error fetching available reports: ', error.message);
            return res.status(500).json({
                error: 'Failed to fetch available reports',
                message: error.message
            });
        }
    } finally{
        if (conn){
            conn.close();
        }
    }
    
    const availableReports: AvailableReportsResponse = {
        INV_ADJ_CC_ING: false,
        INV_ADJ_CC_IPS: false,
        INV_ADJ_OH_IPS: false,
        INV_ADJ_OH_ING: false,
        INV_RR: false,
        INV_TI: false,
        ADJ_S_R: false
    };

    return res.status(200).json(availableReports);
});


router.get("/:reportType", async(req: Request<{reportType: string}>, res: Response<INV_ADJ_CC_IPS[] | ReportError | null>)=> {
    let conn;
    
    const reportType = req.params.reportType;

    switch(reportType) {
        case "INV_ADJ_CC_IPS":
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
                        From IPS.dbo.IPS_INV as IPS LEFT JOIN TUTLIV.dbo.ICITEM I ON TRIM(I.ITEMNO) = TRIM(CAST(IPS.EAN AS Char(24)))
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
            break;
        case "INV_ADJ_OH_ING":
            try {
                conn = await getConnection();
                const result: IResult<INV_ADJ_OH_ING> = await conn.request()
                    .query(`
                        SELECT
                            IPS.WHS,
                            CAST(IPS.EAN AS Char(24)) AS EAN,
                            I.[DESC] as TITLE,
                            IPS.Qty,
                            IPS.Acttype
                        From IPS.dbo.IPS_INV as IPS LEFT JOIN TUTLIV.dbo.ICITEM I ON TRIM(I.ITEMNO) = TRIM(CAST(IPS.EAN AS Char(24)))
                        WHERE IPS.WHS = 'ING' and IPS.Acttype IN('OH','KA','KW')
                            `);
                return res.status(200).json(result.recordset);
            } catch (error) {
                if (error instanceof Error) {
                    console.error('DB error in reports get route: ', error.message);
                }
            } finally {
                if (conn){
                    conn.close();
                }
            }
            break;
        case "INV_TI":
            try {
                conn = await getConnection();
                const result: IResult<INV_ADJ_OH_ING> = await conn.request()
                    .query(
                        `
                        SELECT
                            IPS.WHS,
                            CAST(IPS.EAN AS Char(24)) AS EAN,
                            I.[DESC] as TITLE,
                            IPS.Qty,
                            IPS.Acttype
                        From IPS.dbo.IPS_INV as IPS LEFT JOIN TUTLIV.dbo.ICITEM I ON TRIM(I.ITEMNO) = TRIM(CAST(IPS.EAN AS Char(24)))
                        WHERE IPS.Acctype = 'TI'
                        `)
                return res.status(200).json(result.recordset);
            } catch (error) {
                if (error instanceof Error) {
                    console.error('DB error in reports get route: ', error.message);
                }
            } finally {
                if (conn){
                    conn.close();
                }
            }

        default:
            return res.status(400).json({
                error: 'Invalid report type'
            });
    }

    
        
});









export default router;  