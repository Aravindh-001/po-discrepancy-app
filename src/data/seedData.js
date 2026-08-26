export const seedData = [
  { 
    id: 1, 
    supplier: "TechCorp", 
    poQty: 100, 
    grQty: 95, 
    invQty: 100,
    poPrice: 50,
    grPrice: 50,
    invPrice: 55,
    status: "blocked",
    exception: "Quantity Mismatch"
  },
  { 
    id: 2, 
    supplier: "SupplyCo", 
    poQty: 200, 
    grQty: 200, 
    invQty: 200,
    poPrice: 30,
    grPrice: 30,
    invPrice: 32,
    status: "blocked",
    exception: "Price Mismatch"
  },
  { 
    id: 3, 
    supplier: "Parts Ltd", 
    poQty: 50, 
    grQty: 0, 
    invQty: 50,
    poPrice: 100,
    grPrice: 0,
    invPrice: 100,
    status: "blocked",
    exception: "No GR"
  },
]