import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import { ReportType, ReportData } from '../../hooks/useReports';

// PDF Styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
  },
  tableCell: {
    padding: 5,
    borderRightWidth: 1,
    borderRightColor: '#000',
    flex: 1,
    textAlign: 'left',
    fontSize: 8,
    overflow: 'hidden',
  },
  lastCell: {
    borderRightWidth: 0,
  },
  smallText: {
    fontSize: 7,
  },
});

interface ReportPDFProps {
  reportType: ReportType;
  data: ReportData[];
}

// Define column widths for specific reports
const getColumnWidth = (reportType: ReportType, columnName: string): number => {
  const columnWidths: Record<string, Record<string, number>> = {
    ADJ_S_R: {
      ISBN: 2,
      TITLE: 3,
      Ordnum: 1.5,
      Otype: 1,
      Ponumber: 2,
      Otypesra: 1,
      Billto: 1.5,
      Billtoname: 2.5,
      Qty: 1,
      Price: 1.2,
      Ext: 1.2,
      Discount: 1.2,
    },
    INV_RR: {
      WHS: 1,
      ISBN: 2,
      TITLE: 3,
      QTY: 1,
      REASON_CODE: 1.5,
    },
  };

  return columnWidths[reportType]?.[columnName] || 1;
};

// PDF Document Component
export const ReportPDF = ({ reportType, data }: ReportPDFProps) => {
  if (!data || data.length === 0) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text style={styles.title}>{reportType}</Text>
          <Text>No data available</Text>
        </Page>
      </Document>
    );
  }

  const columns = Object.keys(data[0]);

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Text style={styles.title}>{reportType}</Text>
        
        <View style={styles.table}>
          {/* Header Row */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            {columns.map((col, idx) => (
              <Text
                key={col}
                style={[
                  styles.tableCell,
                  ...(idx === columns.length - 1 ? [styles.lastCell] : []),
                  { flex: getColumnWidth(reportType, col) },
                ]}
              >
                {col}
              </Text>
            ))}
          </View>

          {/* Data Rows */}
          {data.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.tableRow}>
              {columns.map((col, colIdx) => (
                <Text
                  key={`${rowIdx}-${col}`}
                  style={[
                    styles.tableCell,
                    ...(colIdx === columns.length - 1 ? [styles.lastCell] : []),
                    { flex: getColumnWidth(reportType, col) },
                  ]}
                >
                  {row[col] !== null && row[col] !== undefined ? String(row[col]).trim() : '-'}
                </Text>
              ))}
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
};

// Generate and download PDF
export const downloadPDF = async (reportType: ReportType, data: ReportData[]) => {
  const blob = await pdf(<ReportPDF reportType={reportType} data={data} />).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${reportType}_${new Date().toISOString().split('T')[0]}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
};

// Open PDF in new tab
export const viewPDF = async (reportType: ReportType, data: ReportData[]) => {
  const blob = await pdf(<ReportPDF reportType={reportType} data={data} />).toBlob();
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  // Don't revoke immediately - let the browser handle it
};
