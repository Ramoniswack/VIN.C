import { useEffect, useState } from 'react'
import { Link } from "react-router-dom";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  Package, 
  ShoppingCart, 
  Users, 
  TrendingUp,
  ArrowUpRight,
  Calendar,
  ClipboardList,
  Settings,
  Search,
  Filter,
  ArrowDown,
  ArrowUp,
} from "lucide-react";
import { Input } from "@/components/ui/input";

// default stats shown as fallback
const defaultStats = [
  { title: 'Total Revenue', value: '$0', change: '+0%', trend: 'up', icon: DollarSign },
  { title: 'Total Orders', value: '0', change: '+0%', trend: 'up', icon: ShoppingCart },
  { title: 'Products', value: '0', change: '+0', trend: 'up', icon: Package },
  { title: 'Customers', value: '0', change: '+0%', trend: 'up', icon: Users },
]

type TopSelling = { name: string; category: string; sales: number; revenue: string }

// Recent orders
const recentOrders = [
  {
    id: "#ORD-9845",
    customer: "James Wilson",
    date: "Sep 7, 2025",
    status: "Delivered",
    total: "$2,420.00",
  },
  {
    id: "#ORD-9844",
    customer: "Emily Chen",
    date: "Sep 7, 2025",
    status: "Processing",
    total: "$1,380.00",
  },
  {
    id: "#ORD-9843",
    customer: "Michael Brown",
    date: "Sep 6, 2025",
    status: "Shipped",
    total: "$850.00",
  },
  {
    id: "#ORD-9842",
    customer: "Sophia Martinez",
    date: "Sep 6, 2025",
    status: "Delivered",
    total: "$2,280.00",
  },
  {
    id: "#ORD-9841",
    customer: "Robert Johnson",
    date: "Sep 5, 2025",
    status: "Processing",
    total: "$1,800.00",
  },
];

type RecentOrder = { id: string; customer: string; date: string; status: string; total: string }
type ReceivedOrder = { id?: number; email?: string | null; createdAt?: string | Date; status?: string | null; amountTotal?: number }

export const Dashboard = () => {
  const [stats, setStats] = useState(defaultStats)
  const [recentOrdersState, setRecentOrdersState] = useState<RecentOrder[]>(recentOrders as RecentOrder[])
  const [topSellingState, setTopSellingState] = useState<TopSelling[]>([])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('supabase_access_token') ?? sessionStorage.getItem('supabase_access_token') ?? ''
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (token) headers.Authorization = `Bearer ${token}`
        const resp = await fetch('/api/admin/dashboard', { headers })
        if (!resp.ok) {
          // if unauthorized or no data, keep defaults
          return
        }
        const json = await resp.json()
        if (json?.ok) {
          const totalRevenue = Number(json.stats.totalRevenue) || 0
          const totalOrders = Number(json.stats.totalOrders) || 0
          const productsCount = Number(json.stats.productsCount || 0)
          const customersCount = Number(json.stats.customersCount || 0)
          setStats([
            { title: 'Total Revenue', value: totalRevenue > 0 ? `$${(totalRevenue/100).toLocaleString()}` : '$0', change: '+0%', trend: totalRevenue >= 0 ? 'up' : 'down', icon: DollarSign },
            { title: 'Total Orders', value: `${totalOrders}`, change: '+0%', trend: 'up', icon: ShoppingCart },
            { title: 'Products', value: `${productsCount}`, change: '+0', trend: 'up', icon: Package },
            { title: 'Customers', value: `${customersCount}`, change: '+0%', trend: 'up', icon: Users },
          ])
          const received = (json.recentOrders as ReceivedOrder[]) || []
          setRecentOrdersState(received.map((r) => ({ id: `#${r.id}`, customer: r.email ?? '—', date: new Date(r.createdAt || Date.now()).toLocaleDateString(), status: r.status ?? '—', total: `$${((r.amountTotal||0)/100).toFixed(2) }` })))
          // top selling
          const rawTop = (json.topSelling || []) as Array<{ name?: string; category?: string | null; units?: number; revenue?: number }>
          setTopSellingState(rawTop.map((p) => ({ name: p.name || '—', category: p.category || '—', sales: p.units || 0, revenue: `$${((p.revenue||0)/100).toLocaleString()}` })))
        }
      } catch (e) {
        // keep defaults
      }
    }
    fetchStats()
  }, [])
  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-transparent border-graphite/30 hover:border-accent/40 transition-all shadow-sm">
            <CardContent className="p-4 md:p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-graphite">{stat.title}</p>
                  <h3 className="text-xl md:text-2xl font-semibold text-paper mt-1">{stat.value}</h3>
                </div>
                <div className={`p-2 rounded-full ${
                  stat.trend === "up" ? "bg-emerald-100" : "bg-red-100"
                }`}>
                  <stat.icon className={`w-5 h-5 ${
                    stat.trend === "up" ? "text-emerald-600" : "text-red-600"
                  }`} />
                </div>
              </div>
              <div className="mt-3 flex items-center text-xs">
                <span className={`flex items-center ${
                  stat.trend === "up" ? "text-emerald-500" : "text-red-500"
                }`}>
                  {stat.trend === "up" ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                  {stat.change}
                </span>
                <span className="text-graphite ml-1">from previous period</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Selling Products */}
        <Card className="bg-transparent border-graphite/30 col-span-1 lg:col-span-1">
          <CardHeader className="px-4 py-3 md:px-6 md:py-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-paper text-base md:text-lg">Top Selling Products</CardTitle>
              <Button variant="ghost" size="sm" className="text-graphite hover:text-paper text-xs md:text-sm">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 py-2 md:px-6 md:py-4">
            <div className="space-y-4 md:space-y-5">
              {topSellingState.length === 0 ? (
                <div className="text-graphite text-sm">No sales data yet.</div>
              ) : (
                topSellingState.map((product, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div className="space-y-1">
                      <p className="font-medium text-paper text-sm md:text-base">{product.name}</p>
                      <span className="text-xs text-graphite">{product.category} • {product.sales} units</span>
                    </div>
                    <span className="font-medium text-paper text-sm md:text-base">{product.revenue}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
          <CardFooter className="border-t border-graphite/20 pt-4 px-4 md:px-6">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-graphite hover:text-paper flex items-center justify-center text-xs md:text-sm"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              View Sales Report
            </Button>
          </CardFooter>
        </Card>

        {/* Recent Orders */}
        <Card className="bg-transparent border-graphite/30 col-span-1 lg:col-span-2">
          <CardHeader className="px-4 py-3 md:px-6 md:py-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <CardTitle className="text-paper text-base md:text-lg">Recent Orders</CardTitle>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" className="text-graphite border-graphite/30 text-xs md:text-sm">
                  <Filter className="w-3 h-3 md:w-4 md:h-4 mr-1" /> Filter
                </Button>
                <Button variant="ghost" size="sm" className="text-graphite hover:text-paper text-xs md:text-sm">
                  View All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-0 py-0 md:px-2">
            {/* Desktop Table - Hidden on Mobile */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-graphite/20">
                    <th className="text-left p-3 text-graphite font-medium">Order ID</th>
                    <th className="text-left p-3 text-graphite font-medium">Customer</th>
                    <th className="text-left p-3 text-graphite font-medium">Date</th>
                    <th className="text-left p-3 text-graphite font-medium">Status</th>
                    <th className="text-right p-3 text-graphite font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrdersState.map((order, index) => (
                    <tr key={index} className="border-b border-graphite/10 hover:bg-mink/5">
                      <td className="p-3 text-paper">{order.id}</td>
                      <td className="p-3 text-paper">{order.customer}</td>
                      <td className="p-3 text-graphite">{order.date}</td>
                      <td className="p-3">
                        <Badge className={`
                          px-2 py-0.5 text-xs font-medium
                          ${order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' : 
                            order.status === 'Processing' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'}
                        `}>
                          {order.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-right font-medium text-paper">{order.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Mobile Order Cards */}
            <div className="md:hidden">
              {recentOrdersState.map((order, index) => (
                <div key={index} className="border-b border-graphite/10 p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-paper">{order.id}</span>
                    <span className="font-medium text-paper">{order.total}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-paper">{order.customer}</span>
                    <span className="text-xs text-graphite">{order.date}</span>
                  </div>
                  <div>
                    <Badge className={`
                      px-2 py-0.5 text-xs font-medium
                      ${order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' : 
                        order.status === 'Processing' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'}
                    `}>
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions removed: use the admin tabs (Products / Orders / Calendar / Settings / Users) instead */}
    </div>
  );
};

