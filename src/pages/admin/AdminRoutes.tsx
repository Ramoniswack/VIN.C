import { Routes, Route } from "react-router-dom";
import AddProduct from "./AddProduct";
import EditProduct from "./EditProduct";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

export default function AdminRoutes() {
  return (
    <div className="min-h-screen bg-bg">
      <Navigation />
      
      <main className="container mx-auto px-4 pt-28 pb-16">
        <Routes>
          <Route path="/products/new" element={<AddProduct />} />
          <Route path="/products/edit/:productId" element={<EditProduct />} />
        </Routes>
      </main>
      
      <Footer />
    </div>
  );
}
