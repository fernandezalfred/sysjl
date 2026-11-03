export type Locale = "en" | "es";

export const LOCALES: Locale[] = ["en", "es"];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "locale";

export type TranslateVars = Record<string, string | number>;
export type TranslateFn = (key: string, vars?: TranslateVars) => string;

const en = {
  "header.home": "Home",
  "header.dashboard": "Dashboard",
  "header.manageUsers": "Manage users",
  "header.cheese": "Cheese",
  "header.yogurt": "Yogurt",
  "header.milk": "Milk",
  "header.grains": "Grains",
  "header.signIn": "Sign in",
  "header.signOut": "Sign out",
  "header.updated": "Updated",

  "footer.tagline": "SysJL — Daily Sales, Stock & Revenue Tracker",
  "footer.rights": "© {year} SysJL. All rights reserved.",

  "landing.welcomeBack": "Welcome back, {name}.",
  "landing.guestTagline":
    "Track daily sales, stock, and revenue across our delivery fleet — live, every day.",
  "landing.totalsByUser": "Totals by User",

  "driverBanner.label": "Join the team",
  "driverBanner.title": "Drive, sell, earn.",
  "driverBanner.body":
    "We're always looking for drivers to take a vehicle out and sell Cheese, Yogurt, Milk & Hominy. Top sellers earn extra on top of their regular pay.",
  "driverBanner.cta": "Already on the team? Sign in",

  "topSeller.badge": "Top Seller",
  "topSeller.leadingSingular": "{names} is leading the pack{marginPart}.",
  "topSeller.leadingPlural": "{names} are leading the pack{marginPart}.",
  "topSeller.byMargin": " by {margin}",
  "topSeller.pitchSingular": "Top sellers earn extra. Think you can out-sell {names}?",
  "topSeller.pitchPlural": "Top sellers earn extra. Think you can out-sell them?",

  "adminSettings.title": "Admin Settings",
  "adminSettings.manageUsers.label": "Manage users",
  "adminSettings.manageUsers.desc": "Create, edit, assign vehicles",
  "adminSettings.dashboard.label": "Full dashboard",
  "adminSettings.dashboard.desc": "Totals, stock, sale records",

  "summaryCards.totalsSold": "Totals Sold",
  "summaryCards.remainingStock": "Remaining Stock",
  "summaryCards.units": "units",

  "table.user": "User",
  "table.queso": "Cheese",
  "table.yogurt": "Yogurt",
  "table.milkMote": "Milk & Hominy",
  "table.totalRevenue": "Total revenue",
  "table.edit": "Edit",

  "cell.sold": "Total sales",
  "cell.soldWithRevenue": "{sold} sold {revenue}",
  "cell.takenLeft": "{taken} taken · {remaining} left {remainingValue}",
  "cell.unsold": "Unsold",
  "cell.soldPlusUnsold": "Total sold + unsold",
  "cell.winner": "Winner",
  "cell.winnerMargin": "Winner (+{margin})",
  "cell.earned": "Net profit",

  "saleRecords.heading": "Sale Records",
  "saleRecords.newRecord": "New record",
  "saleRecords.totalRevenue": "Total Revenue",

  "records.newRecord": "New record",
  "records.editRecord": "Edit record",
  "records.save": "Save record",
  "records.saving": "Saving…",
  "records.cancel": "Cancel",
  "records.delete": "Delete",
  "records.deleting": "Deleting…",
  "records.selectUser": "Select a user",
  "records.userLabel": "User",
  "records.date": "Date",
  "records.quesoTaken": "Cheese taken",
  "records.quesoLeft": "Cheese left",
  "records.yogurtTaken": "Yogurt taken",
  "records.yogurtLeft": "Yogurt left",
  "records.totalSold": "Total sold",
  "records.confirmDelete": "Delete this record? This cannot be undone.",

  "login.title": "Sign in",
  "login.email": "Email",
  "login.password": "Password",
  "login.submit": "Sign in",
  "login.submitting": "Signing in…",

  "adminUsers.heading": "User Management",
  "adminUsers.subheading":
    "Create and edit accounts, assign vehicles to drivers, and deactivate accounts.",
  "adminUsers.createNew": "Create new user",
  "adminUsers.name": "Name",
  "adminUsers.email": "Email",
  "adminUsers.password": "Password",
  "adminUsers.role": "Role",
  "adminUsers.roleVehicleUser": "Vehicle user",
  "adminUsers.roleAdmin": "Admin",
  "adminUsers.createButton": "Create user",
  "adminUsers.creating": "Creating…",
  "adminUsers.userCreated": "User created.",
  "adminUsers.usersHeading": "Users",
  "adminUsers.active": "Active",
  "adminUsers.inactive": "Inactive",
  "adminUsers.deactivate": "Deactivate account",
  "adminUsers.reactivate": "Reactivate account",
  "adminUsers.newPassword": "New password (leave blank to keep current)",
  "adminUsers.saveChanges": "Save changes",
  "adminUsers.saving": "Saving…",
  "adminUsers.saved": "Saved.",

  "adminProducts.heading": "Sale Prices",
  "adminProducts.subheading":
    "Set the sale price for Cheese and Yogurt. Records already created keep the sale price that was active when they were made — a new price only applies going forward.",
  "adminProducts.setBy": "Set by",
  "adminProducts.date": "Date",
  "adminProducts.salePriceBs": "Sale price (Bs)",
  "adminProducts.savePrice": "Save price",
  "adminProducts.saving": "Saving…",
  "adminProducts.priceUpdated": "Price updated.",
  "adminProducts.currentInfo": "Current: sale {sale}",
  "adminProducts.setByInfo": " — set by {name} on {date}",
  "adminProducts.notSetYet": " (default, not yet set)",
  "investment.heading": "Investment & Stock (All-Time)",
  "investment.subheading": "Cheese and Yogurt only — Milk and Hominy aren't tracked at this level of detail yet.",
  "investment.investment": "Investment",
  "investment.revenue": "Revenue",
  "investment.sold": "Sold",
  "investment.left": "Left",
  "investment.chartInvestmentTitle": "Investment & revenue by product (Bs)",
  "investment.chartSoldLeftTitle": "Sold & left by product (units)",
  "trend.heading": "Sales Revenue Trend",
  "trend.subheading": "Total sold (Bs) across every sale record, all users combined.",
  "trend.grandTotal": "Total sales (all records)",
  "trend.totalRevenue": "Total net profit (all records)",
  "trend.day": "Day",
  "trend.week": "Week",
  "trend.month": "Month",
  "trend.weekOf": "Week of {date}",
  "trend.chartTitle": "Total sold over time (Bs)",
  "trend.noData": "No sale records yet.",

  "sidebar.openMenu": "Open menu",
  "sidebar.closeMenu": "Close menu",
  "sidebar.overview": "Overview",
  "sidebar.administration": "Administration",
  "sidebar.breadcrumbLabel": "Breadcrumb",

  "adminPanel.quickStats": "Quick Stats",
  "adminPanel.activeDrivers": "Active drivers",
  "adminPanel.totalRecords": "Sale records",

  "stock.subheading":
    "Record {product} purchased into the central deposit. Stock is automatically reduced when a driver takes {product} out and restored when the unsold remainder is reported back.",
  "stock.subheadingPurchaseOnly": "Record {product} purchased into the central deposit. Purchases only; stock is not tracked.",
  "stock.currentStock": "Current deposit stock",
  "stock.purchaseHistory": "Purchase History",
  "stock.noPurchases": "No stock purchases have been recorded yet.",
  "stock.newPurchase": "New purchase",
  "stock.editPurchase": "Edit purchase",
  "stock.quantity": "Quantity purchased",
  "stock.quantityUnit": "{quantity} units",
  "stock.quantityLiters": "Quantity purchased (liters)",
  "stock.quantityUnitLiters": "{quantity} liters",
  "stock.quantityQuartilla": "Quantity purchased (quartillas)",
  "stock.quantityUnitQuartilla": "{quantity} quartillas",
  "stock.unitCost": "Unit cost",
  "stock.unitCostLiters": "Cost per liter",
  "stock.unitCostQuartilla": "Price per quartilla",
  "stock.totalCost": "Total cost",
  "stock.earning": "Expected profit",
  "stock.save": "Save purchase",
  "stock.saving": "Saving…",
  "stock.cancel": "Cancel",
  "stock.delete": "Delete",
  "stock.deleting": "Deleting…",
  "stock.confirmDelete": "Delete this stock purchase? This cannot be undone.",

  "product.queso": "Cheese",
  "product.yogurt": "Yogurt",
  "product.milk": "Milk",
  "product.maizPelado": "Peeled corn",
  "product.maizCascara": "Corn with husk",
  "product.haba": "Fava bean",

  "grains.heading": "Grains",
  "grains.subheading":
    "Record grain purchases into the central deposit — pick the item and its price per quartilla. Purchases only; stock is not tracked.",
  "grains.item": "Item",
  "grains.selectItem": "Select an item",

  "milk.forDriver": "For",
} as const;

type DictionaryKey = keyof typeof en;

const es: Record<DictionaryKey, string> = {
  "header.home": "Inicio",
  "header.dashboard": "Panel",
  "header.manageUsers": "Gestionar usuarios",
  "header.cheese": "Queso",
  "header.yogurt": "Yogurt",
  "header.milk": "Leche",
  "header.grains": "Granos",
  "header.signIn": "Iniciar sesión",
  "header.signOut": "Cerrar sesión",
  "header.updated": "Actualizado",

  "footer.tagline": "SysJL — Control de Ventas, Stock e Ingresos",
  "footer.rights": "© {year} SysJL. Todos los derechos reservados.",

  "landing.welcomeBack": "Bienvenido de nuevo, {name}.",
  "landing.guestTagline":
    "Sigue las ventas, el stock y los ingresos de nuestra flota de reparto — en vivo, todos los días.",
  "landing.totalsByUser": "Totales por Usuario",

  "driverBanner.label": "Únete al equipo",
  "driverBanner.title": "Conduce, vende, gana.",
  "driverBanner.body":
    "Siempre buscamos conductores para salir con un vehículo y vender Queso, Yogurt, Leche y Mote. Los mejores vendedores ganan un extra sobre su pago regular.",
  "driverBanner.cta": "¿Ya eres parte del equipo? Inicia sesión",

  "topSeller.badge": "Mejor Vendedor",
  "topSeller.leadingSingular": "{names} va a la cabeza{marginPart}.",
  "topSeller.leadingPlural": "{names} van a la cabeza{marginPart}.",
  "topSeller.byMargin": " por {margin}",
  "topSeller.pitchSingular": "Los mejores vendedores ganan extra. ¿Crees que puedes superar a {names}?",
  "topSeller.pitchPlural": "Los mejores vendedores ganan extra. ¿Crees que puedes superarlos?",

  "adminSettings.title": "Configuración de Administrador",
  "adminSettings.manageUsers.label": "Gestionar usuarios",
  "adminSettings.manageUsers.desc": "Crear, editar, asignar vehículos",
  "adminSettings.dashboard.label": "Panel completo",
  "adminSettings.dashboard.desc": "Totales, stock, registros de venta",

  "summaryCards.totalsSold": "Totales Vendidos",
  "summaryCards.remainingStock": "Stock Restante",
  "summaryCards.units": "unidades",

  "table.user": "Usuario",
  "table.queso": "Queso",
  "table.yogurt": "Yogurt",
  "table.milkMote": "Leche y Mote",
  "table.totalRevenue": "Ingreso total",
  "table.edit": "Editar",

  "cell.sold": "Total venta",
  "cell.soldWithRevenue": "{sold} vendido {revenue}",
  "cell.takenLeft": "{taken} tomado · {remaining} restante {remainingValue}",
  "cell.unsold": "No vendidos",
  "cell.soldPlusUnsold": "Total vendidos más no vendidos",
  "cell.winner": "Ganador",
  "cell.winnerMargin": "Ganador (+{margin})",
  "cell.earned": "Ganancia neta",

  "saleRecords.heading": "Registros de Venta",
  "saleRecords.newRecord": "Nuevo registro",
  "saleRecords.totalRevenue": "Ingreso Total",

  "records.newRecord": "Nuevo registro",
  "records.editRecord": "Editar registro",
  "records.save": "Guardar registro",
  "records.saving": "Guardando…",
  "records.cancel": "Cancelar",
  "records.delete": "Eliminar",
  "records.deleting": "Eliminando…",
  "records.selectUser": "Selecciona un usuario",
  "records.userLabel": "Usuario",
  "records.date": "Fecha",
  "records.quesoTaken": "Queso tomado",
  "records.quesoLeft": "Queso restante",
  "records.yogurtTaken": "Yogurt tomado",
  "records.yogurtLeft": "Yogurt restante",
  "records.totalSold": "Total vendido",
  "records.confirmDelete": "¿Eliminar este registro? Esta acción no se puede deshacer.",

  "login.title": "Iniciar sesión",
  "login.email": "Correo electrónico",
  "login.password": "Contraseña",
  "login.submit": "Iniciar sesión",
  "login.submitting": "Iniciando sesión…",

  "adminUsers.heading": "Gestión de Usuarios",
  "adminUsers.subheading":
    "Crea y edita cuentas, asigna vehículos a conductores y desactiva cuentas.",
  "adminUsers.createNew": "Crear nuevo usuario",
  "adminUsers.name": "Nombre",
  "adminUsers.email": "Correo electrónico",
  "adminUsers.password": "Contraseña",
  "adminUsers.role": "Rol",
  "adminUsers.roleVehicleUser": "Usuario de vehículo",
  "adminUsers.roleAdmin": "Administrador",
  "adminUsers.createButton": "Crear usuario",
  "adminUsers.creating": "Creando…",
  "adminUsers.userCreated": "Usuario creado.",
  "adminUsers.usersHeading": "Usuarios",
  "adminUsers.active": "Activo",
  "adminUsers.inactive": "Inactivo",
  "adminUsers.deactivate": "Desactivar cuenta",
  "adminUsers.reactivate": "Reactivar cuenta",
  "adminUsers.newPassword": "Nueva contraseña (déjalo en blanco para mantener la actual)",
  "adminUsers.saveChanges": "Guardar cambios",
  "adminUsers.saving": "Guardando…",
  "adminUsers.saved": "Guardado.",

  "adminProducts.heading": "Precios de Venta",
  "adminProducts.subheading":
    "Establece el precio de venta para Queso y Yogurt. Los registros ya creados mantienen el precio de venta vigente al momento de crearse — un nuevo precio solo aplica hacia adelante.",
  "adminProducts.setBy": "Establecido por",
  "adminProducts.date": "Fecha",
  "adminProducts.salePriceBs": "Precio de venta (Bs)",
  "adminProducts.savePrice": "Guardar precio",
  "adminProducts.saving": "Guardando…",
  "adminProducts.priceUpdated": "Precio actualizado.",
  "adminProducts.currentInfo": "Actual: venta {sale}",
  "adminProducts.setByInfo": " — establecido por {name} el {date}",
  "adminProducts.notSetYet": " (predeterminado, aún no establecido)",
  "investment.heading": "Inversión y Stock (Histórico)",
  "investment.subheading": "Solo Queso y Yogurt — Leche y Mote aún no se rastrean con este nivel de detalle.",
  "investment.investment": "Inversión",
  "investment.revenue": "Ingresos",
  "investment.sold": "Vendido",
  "investment.left": "Restante",
  "investment.chartInvestmentTitle": "Inversión e ingresos por producto (Bs)",
  "investment.chartSoldLeftTitle": "Vendido y restante por producto (unidades)",
  "trend.heading": "Tendencia de Ingresos por Ventas",
  "trend.subheading": "Total vendido (Bs) de todos los registros de venta, todos los usuarios combinados.",
  "trend.grandTotal": "Total ventas (todos los registros)",
  "trend.totalRevenue": "Ganancia neta total (todos los registros)",
  "trend.day": "Día",
  "trend.week": "Semana",
  "trend.month": "Mes",
  "trend.weekOf": "Semana del {date}",
  "trend.chartTitle": "Total vendido en el tiempo (Bs)",
  "trend.noData": "Aún no hay registros de venta.",

  "sidebar.openMenu": "Abrir menú",
  "sidebar.closeMenu": "Cerrar menú",
  "sidebar.overview": "Resumen",
  "sidebar.administration": "Administración",
  "sidebar.breadcrumbLabel": "Ruta de navegación",

  "adminPanel.quickStats": "Estadísticas Rápidas",
  "adminPanel.activeDrivers": "Conductores activos",
  "adminPanel.totalRecords": "Registros de venta",

  "stock.subheading":
    "Registra el {product} comprado hacia el depósito central. El stock se reduce automáticamente cuando un conductor retira {product} y se restituye cuando se reporta lo que sobró.",
  "stock.subheadingPurchaseOnly": "Registra el {product} comprado hacia el depósito central. Solo compras; no se controla el stock.",
  "stock.currentStock": "Stock actual en depósito",
  "stock.purchaseHistory": "Historial de Compras",
  "stock.noPurchases": "Aún no se han registrado compras de stock.",
  "stock.newPurchase": "Nueva compra",
  "stock.editPurchase": "Editar compra",
  "stock.quantity": "Cantidad comprada",
  "stock.quantityUnit": "{quantity} unidades",
  "stock.quantityLiters": "Cantidad comprada (litros)",
  "stock.quantityUnitLiters": "{quantity} litros",
  "stock.quantityQuartilla": "Cantidad comprada (cuartillas)",
  "stock.quantityUnitQuartilla": "{quantity} cuartillas",
  "stock.unitCost": "Costo unitario",
  "stock.unitCostLiters": "Costo por litro",
  "stock.unitCostQuartilla": "Precio por cuartilla",
  "stock.totalCost": "Costo total",
  "stock.earning": "Ganancia esperada",
  "stock.save": "Guardar compra",
  "stock.saving": "Guardando…",
  "stock.cancel": "Cancelar",
  "stock.delete": "Eliminar",
  "stock.deleting": "Eliminando…",
  "stock.confirmDelete": "¿Eliminar esta compra de stock? Esta acción no se puede deshacer.",

  "product.queso": "Queso",
  "product.yogurt": "Yogurt",
  "product.milk": "Leche",
  "product.maizPelado": "Maíz Pelado",
  "product.maizCascara": "Maíz con Cáscara",
  "product.haba": "Haba",

  "grains.heading": "Granos",
  "grains.subheading":
    "Registra las compras de granos hacia el depósito central — elige el insumo y su precio por cuartilla. Solo compras; no se controla el stock.",
  "grains.item": "Insumo",
  "grains.selectItem": "Selecciona un insumo",

  "milk.forDriver": "Para",
};

export const dictionaries: Record<Locale, Record<DictionaryKey, string>> = { en, es };

export function translate(locale: Locale, key: string, vars?: TranslateVars): string {
  const dict = dictionaries[locale] as Record<string, string>;
  let value = dict[key] ?? dictionaries[DEFAULT_LOCALE][key as DictionaryKey] ?? key;
  if (vars) {
    for (const [name, v] of Object.entries(vars)) {
      value = value.replaceAll(`{${name}}`, String(v));
    }
  }
  return value;
}

// For Suspense fallbacks rendered before the real locale (read from a cookie) is
// known — a brief, English-only flash while the real content streams in.
export const defaultT: TranslateFn = (key, vars) => translate(DEFAULT_LOCALE, key, vars);
