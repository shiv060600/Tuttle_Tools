-- SQL Server: logging table with timestamp index

CREATE TABLE dbo.TuttleMappingLogger (
    LOG_ID              UNIQUEIDENTIFIER NOT NULL DEFAULT (NEWID()) PRIMARY KEY,
    ROWNUM              INT              NULL, -- reference only, not a PK/FK
    ACTION              VARCHAR(10)      NOT NULL,
    BILLTO_FROM         VARCHAR(50)     NULL,
    SHIPTO_FROM         VARCHAR(50)     NULL,
    HQ_FROM             VARCHAR(50)     NULL,
    SSACCT_FROM         VARCHAR(50)     NULL,
    BILLTO_TO           VARCHAR(50)     NULL,
    SHIPTO_TO           VARCHAR(50)     NULL,
    HQ_TO               VARCHAR(50)     NULL,
    SSACCT_TO           VARCHAR(50)     NULL,
    ACTION_TIMESTAMP    DATETIME2(3)     NOT NULL CONSTRAINT DF_TML_ACTION_TS DEFAULT (SYSUTCDATETIME())
);

-- Index for efficient range queries on time
CREATE INDEX IX_TuttleMappingLogger_ActionTimestamp
    ON dbo.TuttleMappingLogger (ACTION_TIMESTAMP);
