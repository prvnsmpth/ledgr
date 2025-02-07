import * as XLSX from 'xlsx';

export class XLSXReader {
    static async readFile(file: File): Promise<any[][]> {
        if (file.type !== "application/vnd.ms-excel") {
            throw new Error("File mime type is not application/vnd.ms-excel")
        }
        const data = await file.arrayBuffer()
        const workbook = XLSX.read(data)
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const json: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 })
        return json
    }
}