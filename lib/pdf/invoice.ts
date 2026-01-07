import PDFDocument from "pdfkit"

interface InvoiceData {
  order_number: string
  customer: {
    name: string
    email?: string
    phone?: string
    address?: string
  } | null
  items: Array<{
    design_name: string
    quantity: number
    base_price: number
    customisation_delta: number
    discount: number
    tax_rate: number
    total: number
  }>
  total_amount: number
  tax_amount: number
  created_at: string
}

export function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
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
      doc.fontSize(12).text("Invoice", { align: "center" })
      doc.moveDown()

      // Invoice details
      doc.fontSize(10)
      doc.text(`Invoice Number: ${data.order_number}`)
      doc.text(`Date: ${new Date(data.created_at).toLocaleDateString()}`)
      doc.moveDown()

      // Customer details
      if (data.customer) {
        doc.text("Bill To:", { underline: true })
        doc.text(data.customer.name)
        if (data.customer.address) doc.text(data.customer.address)
        if (data.customer.phone) doc.text(`Phone: ${data.customer.phone}`)
        if (data.customer.email) doc.text(`Email: ${data.customer.email}`)
        doc.moveDown()
      }

      // Items table
      doc.text("Items:", { underline: true })
      doc.moveDown(0.5)

      // Table header
      doc.font("Helvetica-Bold")
      doc.text("Item", 50, doc.y)
      doc.text("Qty", 300, doc.y)
      doc.text("Price", 350, doc.y)
      doc.text("Total", 450, doc.y)
      doc.moveDown()

      doc.font("Helvetica")
      let yPos = doc.y
      for (const item of data.items) {
        doc.text(item.design_name, 50, yPos, { width: 200 })
        doc.text(item.quantity.toString(), 300, yPos)
        doc.text(`₹${item.base_price.toFixed(2)}`, 350, yPos)
        doc.text(`₹${item.total.toFixed(2)}`, 450, yPos)
        yPos += 20
      }

      doc.y = yPos + 10
      doc.moveDown()

      // Totals
      doc.font("Helvetica-Bold")
      doc.text(`Subtotal: ₹${(data.total_amount - data.tax_amount).toFixed(2)}`, { align: "right" })
      doc.text(`Tax: ₹${data.tax_amount.toFixed(2)}`, { align: "right" })
      doc.text(`Total: ₹${data.total_amount.toFixed(2)}`, { align: "right" })

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

