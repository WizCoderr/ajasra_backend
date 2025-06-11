    export interface User {
        id: string;
        email: string;
        password: string;
        fullName: string;
        phoneNumber?: string;
        role: UserRole;
        createdAt: Date;
        updatedAt: Date;
    }
export enum UserRole {
USER = "USER",
ADMIN = "ADMIN"
}
export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    images: string[];
    category: Category;
    sizes: Size[];
    colors: Color[];
    material: string;
    fit: "SLIM" | "REGULAR" | "RELAXED";
    inStock: boolean;
    featured: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface Category {
    id: string;
    name: string;
    slug: string;
    description?: string;
}

export interface Size {
    id: string;
    name: string;
    chest: number;
    waist: number;
    sleeve: number;
    inStock: boolean;
}

export interface Color {
    id: string;
    name: string;
    hex: string;
    inStock: boolean;
}

export interface Order {
    id: string;
    userId: string;
    items: OrderItem[];
    total: number;
    status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
    shippingAddress: Address;
    paymentMethod: string;
    paymentStatus: "PENDING" | "PAID" | "FAILED";
    createdAt: Date;
    updatedAt: Date;
}

export interface OrderItem {
    id: string;
    productId: string;
    quantity: number;
    size: string;
    color: string;
    price: number;
}

export interface Address {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
}
