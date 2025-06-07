export interface IProductSize {
    size: string;
    chest: number;
    waist: number;
    sleeve: number;
    quantity: number;
    inStock: boolean;
}

export interface IProductColor {
    name: string;
    hex: string;
    quantity: number;
    inStock: boolean;
}

export interface ICreateProductInput {
    name: string;
    description: string;
    price: number;
    material: string;
    fit: 'SLIM' | 'REGULAR' | 'LOOSE';
    brand: string;
    featured: boolean;
    sizes: IProductSize[];
    colors: IProductColor[];
    categoryId: string;
}