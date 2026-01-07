"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-screen p-6">
      {/* Product Search */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Product Search</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Search by name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-4"
            />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {filteredDesigns?.map((design) => (
                <Card
                  key={design.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => addToCart(design)}
                >
                  <CardContent className="p-4">
                    <p className="font-semibold">{design.name}</p>
                    <p className="text-sm text-gray-600">{design.sku}</p>
                    <p className="text-sm font-semibold mt-2">
                      ₹{design.base_selling_price.toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cart */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Cart</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cart.length === 0 ? (
              <p className="text-gray-500">Cart is empty</p>
            ) : (
              <>
                {cart.map((item, index) => (
                  <div key={index} className="border p-3 rounded">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold">{item.design.name}</p>
                        <p className="text-sm text-gray-600">
                          ₹{item.design.base_selling_price.toFixed(2)} each
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateQuantity(index, Math.max(1, item.quantity - 1))
                            }
                          >
                            -
                          </Button>
                          <span>{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(index, item.quantity + 1)}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeFromCart(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-4">
                  <p className="text-lg font-bold">
                    Total: ₹{total.toFixed(2)}
                  </p>
                </div>
                <Button
                  className="w-full"
                  onClick={handleCheckout}
                  disabled={cart.length === 0}
                >
                  Checkout
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

