import { supabase } from './supabase';

// Fetch all products for a user
export const fetchProducts = async (userId) => {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching products:', error);
        throw error;
    }

    // Map snake_case from DB to camelCase for frontend
    return data.map(mapProductFromDb);
};

// Create a new product
export const createProduct = async (product, userId) => {
    const dbProduct = mapProductToDb(product, userId);

    const { data, error } = await supabase
        .from('products')
        .insert([dbProduct])
        .select()
        .single();

    if (error) {
        console.error('Error creating product:', error);
        throw error;
    }

    return mapProductFromDb(data);
};

// Update an existing product
export const updateProduct = async (product) => {
    const { id, ...updateData } = mapProductToDb(product);

    const { data, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', product.id)
        .select()
        .single();

    if (error) {
        console.error('Error updating product:', error);
        throw error;
    }

    return mapProductFromDb(data);
};

// Delete a product
export const deleteProduct = async (productId) => {
    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

    if (error) {
        console.error('Error deleting product:', error);
        throw error;
    }

    return true;
};

// Bulk upload products (for initial migration from localStorage)
export const uploadLocalProducts = async (products, userId) => {
    const dbProducts = products.map(p => mapProductToDb(p, userId));

    const { data, error } = await supabase
        .from('products')
        .insert(dbProducts)
        .select();

    if (error) {
        console.error('Error uploading products:', error);
        throw error;
    }

    return data.map(mapProductFromDb);
};

// Helper: Map frontend camelCase to DB snake_case
const mapProductToDb = (product, userId = null) => {
    const mapped = {
        name: product.name,
        price: parseFloat(product.price) || 0,
        initial_price: parseFloat(product.initialPrice) || parseFloat(product.price) || 0,
        category: product.category || '',
        url: product.url || '',
        image_url: product.imageUrl || '',
        target_price: product.targetPrice ? parseFloat(product.targetPrice) : null,
        priority: parseInt(product.priority) || 2,
        is_purchased: product.isPurchased || false,
        is_archived: product.isArchived || false,
        purchase_date: product.purchaseDate || null,
        created_at: product.createdAt || new Date().toISOString(),
        last_checked: product.lastChecked || null
    };

    if (product.id) {
        mapped.id = product.id;
    }

    if (userId) {
        mapped.user_id = userId;
    }

    return mapped;
};

// Helper: Map DB snake_case to frontend camelCase
const mapProductFromDb = (dbProduct) => {
    return {
        id: dbProduct.id,
        name: dbProduct.name,
        price: dbProduct.price,
        initialPrice: dbProduct.initial_price,
        category: dbProduct.category,
        url: dbProduct.url,
        imageUrl: dbProduct.image_url,
        targetPrice: dbProduct.target_price,
        priority: dbProduct.priority,
        isPurchased: dbProduct.is_purchased,
        isArchived: dbProduct.is_archived,
        purchaseDate: dbProduct.purchase_date,
        createdAt: dbProduct.created_at,
        lastChecked: dbProduct.last_checked
    };
};
