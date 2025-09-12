import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Route, Routes, Outlet } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { Dashboard } from "@/components/admin/Dashboard";
import { ProductManager } from "@/components/admin/ProductManager";

export default function Admin() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [searchParams] = useSearchParams();
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Get tab from URL or use default
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated || !user?.isAdmin) {
      navigate("/auth");
    }
  }, [isAuthenticated, user, navigate]);
  
  // Handle success messages
  useEffect(() => {
    const successParam = searchParams.get("success");
    if (successParam) {
      switch (successParam) {
        case "created":
          setSuccess("Product created successfully");
          break;
        case "updated":
          setSuccess("Product updated successfully");
          break;
        case "deleted":
          setSuccess("Product deleted successfully");
          break;
        default:
          setSuccess(null);
      }
      
      // Clear success message after 3 seconds
      const timer = setTimeout(() => {
        setSuccess(null);
        // Remove success from URL
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete("success");
        navigate({ search: newSearchParams.toString() }, { replace: true });
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [searchParams, navigate]);
  
  // Handle tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Update URL with tab parameter
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("tab", value);
    navigate({ search: newSearchParams.toString() }, { replace: true });
  };

  return (
    <div className="min-h-screen bg-bg">
      <Navigation />
      
      <main className="container mx-auto px-4 pt-28 pb-16">
        <div className="flex flex-col space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-display font-medium text-paper">Admin Dashboard</h1>
              <p className="text-graphite mt-1">Welcome back, {user?.username || 'Admin'}</p>
            </div>
            
            <Button 
              variant="outline" 
              className="border-graphite/30"
              onClick={() => useAuthStore.getState().logout()}
            >
              Logout
            </Button>
          </div>
          
          {/* Success Alert */}
          {success && (
            <Alert className="bg-emerald-50 text-emerald-800 border-emerald-200">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          
          <Tabs 
            value={activeTab} 
            onValueChange={handleTabChange}
            className="mt-6"
          >
            <TabsList className="bg-transparent border-b border-graphite/30">
              <TabsTrigger 
                value="dashboard" 
                className="data-[state=active]:text-accent data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none"
              >
                Dashboard
              </TabsTrigger>
              <TabsTrigger 
                value="products" 
                className="data-[state=active]:text-accent data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none"
              >
                Products
              </TabsTrigger>
              <TabsTrigger 
                value="orders" 
                className="data-[state=active]:text-accent data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none"
              >
                Orders
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="data-[state=active]:text-accent data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none"
              >
                Settings
              </TabsTrigger>
            </TabsList>
            
            <div className="mt-6">
              {activeTab === "dashboard" && <Dashboard />}
              {activeTab === "products" && <ProductManager />}
              {activeTab === "orders" && (
                <div className="rounded-md border border-graphite/30 p-8 text-center text-graphite">
                  <p>Order management will be available soon.</p>
                </div>
              )}
              {activeTab === "settings" && (
                <div className="rounded-md border border-graphite/30 p-8 text-center text-graphite">
                  <p>Settings will be available soon.</p>
                </div>
              )}
            </div>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
