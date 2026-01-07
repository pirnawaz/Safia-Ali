import PDFDocument from "pdfkit"
import { formatCurrency } from "@/lib/format"

interface ReceiptData {
  receipt_number: string
  order_number: string
  customer: {
    name: string
  } | null
  amount: number
  method: string
  created_at: string
}

export function generateReceiptPDF(data: ReceiptData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 })
      const buffers: Buffer[] = []

      doc.on("data", buffers.push.bind(buffers))
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(buffers)
        resolve(pdfBuffer)
      })
      doc.on("error", reject)

      // Header
      doc.fontSize(20).text("Safia Ali", { align: "center" })
      doc.fontSize(12).text("Receipt", { align: "center" })
      doc.moveDown()

      // Receipt details
      doc.fontSize(10)
      doc.text(`Receipt Number: ${data.receipt_number}`)
      doc.text(`Order Number: ${data.order_number}`)
      doc.text(`Date: ${new Date(data.created_at).toLocaleDateString()}`)
      doc.moveDown()

      // Customer
      if (data.customer) {
        doc.text(`Customer: ${data.customer.name}`)
        doc.moveDown()
      }

      // Payment details
      doc.text("Payment Details:", { underline: true })
      doc.moveDown(0.5)
      doc.text(`Amount: ${formatCurrency(data.amount)}`)
      doc.text(`Method: ${data.method.toUpperCase()}`)
      doc.moveDown()

      doc.text("Thank you for your business!", { align: "center" })

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

