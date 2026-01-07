"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"

interface Design {
  id: string
  name: string
  sku: string
  base_selling_price: number
}

interface CartItem {
  design: Design
  quantity: number
  customisations?: {
    size?: string
    notes?: string
  }
}

export default function POSPage() {
  const [search, setSearch] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null)

  const { data: designs } = useQuery<Design[]>({
    queryKey: ["designs"],
    queryFn: async () => {
      const res = await fetch("/api/designs")
      if (!res.ok) throw new Error("Failed to fetch designs")
      return res.json()
    },
  })

  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await fetch("/api/customers")
      if (!res.ok) throw new Error("Failed to fetch customers")
      return res.json()
    },
  })

  const filteredDesigns = designs?.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.sku.toLowerCase().includes(search.toLowerCase())
  )

  const addToCart = (design: Design) => {
    setCart([...cart, { design, quantity: 1 }])
  }

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index))
  }

  const updateQuantity = (index: number, quantity: number) => {
    const newCart = [...cart]
    newCart[index].quantity = quantity
    setCart(newCart)
  }

  const total = cart.reduce(
    (sum, item) => sum + item.design.base_selling_price * item.quantity,
    0
  )

  const handleCheckout = async () => {
    try {
      const res = await fetch("/api/sales/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: selectedCustomer || undefined,
          items: cart.map((item) => ({
            design_id: item.design.id,
            quantity: item.quantity,
            base_price: item.design.base_selling_price,
            requires_job_card: true, // All POS items are made-to-order
          })),
        }),
      })

      if (!res.ok) throw new Error("Failed to create order")

      const order = await res.json()
      alert(`Order ${order.order_number} created!`)
      setCart([])
      setSelectedCustomer(null)
    } catch (error: any) {
      alert(error.message)
    }
  }

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 md:gap-6 h-screen p-4 md:p-6">
      {/* Product Search */}
      <div className="lg:col-span-2 space-y-4 overflow-hidden flex flex-col">
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg md:text-xl">Product Search</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col overflow-hidden">
            <Input
              placeholder="Search by name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-4 h-12 text-base touch-manipulation"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 overflow-y-auto flex-1">
              {filteredDesigns?.map((design) => (
                <Card
                  key={design.id}
                  className="cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
                  onClick={() => addToCart(design)}
                >
                  <CardContent className="p-4 min-h-[100px] flex flex-col justify-between">
                    <div>
                      <p className="font-semibold text-sm md:text-base line-clamp-2">{design.name}</p>
                      <p className="text-xs md:text-sm text-gray-600 mt-1">{design.sku}</p>
                    </div>
                    <p className="text-base md:text-lg font-bold mt-2 text-blue-600">
                      {formatCurrency(design.base_selling_price)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
            {(!filteredDesigns || filteredDesigns.length === 0) && (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                No products found
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cart - Sticky on mobile */}
      <div className="lg:space-y-4 lg:sticky lg:top-6 lg:h-fit">
        <Card className="lg:max-h-[calc(100vh-3rem)] flex flex-col">
          <CardHeader className="pb-3 sticky top-0 bg-white z-10 border-b">
            <CardTitle className="text-lg md:text-xl">Cart ({cart.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4 overflow-y-auto flex-1 pt-4">
            {cart.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Cart is empty</p>
            ) : (
              <>
                <div className="space-y-3">
                  {cart.map((item, index) => (
                    <div key={index} className="border p-3 rounded-lg">
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm md:text-base truncate">{item.design.name}</p>
                          <p className="text-xs md:text-sm text-gray-600 mt-1">
                            {formatCurrency(item.design.base_selling_price)} each
                          </p>
                          <div className="flex items-center gap-3 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-9 w-9 p-0 touch-manipulation"
                              onClick={() =>
                                updateQuantity(index, Math.max(1, item.quantity - 1))
                              }
                            >
                              -
                            </Button>
                            <span className="font-semibold min-w-[2rem] text-center">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-9 w-9 p-0 touch-manipulation"
                              onClick={() => updateQuantity(index, item.quantity + 1)}
                            >
                              +
                            </Button>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="touch-manipulation shrink-0"
                          onClick={() => removeFromCart(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-4 sticky bottom-0 bg-white">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-base md:text-lg font-semibold">Total:</span>
                      <span className="text-xl md:text-2xl font-bold text-blue-600">
                        {formatCurrency(total)}
                      </span>
                    </div>
                    <Button
                      className="w-full h-12 text-base touch-manipulation"
                      onClick={handleCheckout}
                      disabled={cart.length === 0}
                    >
                      Checkout
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

