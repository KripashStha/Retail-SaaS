import React, { useState, useEffect } from 'react';
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Plus, Pencil, Trash, X } from "lucide-react";

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({
    id: null,
    type: null
  });
  const [error, setError] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const initialFormState = {
    name: '',
    description: '',
    price: '',
    quantity: ''
  };
  const [formData, setFormData] = useState(initialFormState);

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      setError(`Error loading products: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async (productData) => {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create product');
    }
    return response.json();
  };
  
  const updateProduct = async (id, updateData) => {
    const response = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id,  // Add explicit ID
        ...updateData,
        price: parseFloat(updateData.price),
        quantity: parseInt(updateData.quantity)
      }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update product');
    }
    return response.json();
  };
  
  const deleteProduct = async (id) => {
    const response = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id }),  // Send ID in request body
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete product');
    }
    return response.json();
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const resetForm = () => {
    setFormData(initialFormState);
    setEditingProduct(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // For number inputs, ensure value is non-negative
    if ((name === 'price' || name === 'quantity') && value < 0) {
      return;
    }
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading({ id: 'form', type: 'submit' });
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, formData);
      } else {
        await createProduct(formData);
      }
      resetForm();
      await fetchProducts();
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading({ id: null, type: null });
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      quantity: product.quantity.toString()
    });
    setError(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    setActionLoading({ id, type: 'delete' });
    try {
      await deleteProduct(id);
      await fetchProducts();
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading({ id: null, type: null });
    }
  };

  if (loading && !products.length) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>
            {editingProduct ? 'Edit Product' : 'Add New Product'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Product Name"
                required
                disabled={actionLoading.id === 'form'}
              />
              <Input
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Description"
                required
                disabled={actionLoading.id === 'form'}
              />
              <Input
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="Price"
                required
                disabled={actionLoading.id === 'form'}
              />
              <Input
                name="quantity"
                type="number"
                min="0"
                step="1"
                value={formData.quantity}
                onChange={handleInputChange}
                placeholder="Quantity"
                required
                disabled={actionLoading.id === 'form'}
              />
            </div>
            <div className="flex justify-end gap-2">
              {editingProduct && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={actionLoading.id === 'form'}
                >
                  Cancel
                </Button>
              )}
              <Button 
                type="submit"
                disabled={actionLoading.id === 'form'}
              >
                {actionLoading.id === 'form' && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                {editingProduct ? 'Update Product' : 'Add Product'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription className="flex justify-between items-center">
            <span>{error}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="h-4 w-4 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        {products.map(product => (
          <Card key={product.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <h3 className="font-semibold">{product.name}</h3>
                <p className="text-sm text-gray-600">{product.description}</p>
                <div className="mt-1">
                  <span className="text-sm mr-4">
                    Price: ${Number(product.price).toFixed(2)}
                  </span>
                  <span className="text-sm">
                    Quantity: {product.quantity}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(product)}
                  disabled={actionLoading.id === product.id}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(product.id)}
                  disabled={actionLoading.id === product.id}
                >
                  {actionLoading.id === product.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProductManagement;