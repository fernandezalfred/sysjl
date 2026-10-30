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
  "header.productPrices": "Product prices",
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
    "We're always looking for drivers to take a vehicle out and sell Queso, Yogurt, Milk & Mote. Top sellers earn extra on top of their regular pay.",
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
  "adminSettings.productPrices.label": "Product prices",
  "adminSettings.productPrices.desc": "Costs, sale prices, history",
  "adminSettings.dashboard.label": "Full dashboard",
  "adminSettings.dashboard.desc": "Totals, stock, sale records",

  "summaryCards.totalsSold": "Totals Sold",
  "summaryCards.remainingStock": "Remaining Stock",
  "summaryCards.combined": "Combined",
  "summaryCards.combinedValue": "Combined value",
  "summaryCards.units": "units",

  "table.user": "User",
  "table.queso": "Queso",
  "table.yogurt": "Yogurt",
  "table.milkMote": "Milk & Mote",
  "table.totalRevenue": "Total revenue",
  "table.edit": "Edit",

  "cell.sold": "{amount} sold",
  "cell.soldWithRevenue": "{sold} sold ({revenue})",
  "cell.takenLeft": "{taken} taken · {remaining} left ({remainingValue})",
  "cell.leftValue": "{left} left, value {total}",
  "cell.winner": "Winner",
  "cell.winnerMargin": "Winner (+{margin})",

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
  "records.quesoTaken": "Queso taken",
  "records.quesoLeft": "Queso left",
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
  "adminUsers.noVehicle": "No vehicle",
  "adminUsers.active": "Active",
  "adminUsers.inactive": "Inactive",
  "adminUsers.deactivate": "Deactivate account",
  "adminUsers.reactivate": "Reactivate account",
  "adminUsers.vehicle": "Vehicle",
  "adminUsers.newPassword": "New password (leave blank to keep current)",
  "adminUsers.saveChanges": "Save changes",
  "adminUsers.saving": "Saving…",
  "adminUsers.saved": "Saved.",

  "adminProducts.backToDashboard": "← Back to dashboard",
  "adminProducts.heading": "Product Prices",
  "adminProducts.subheading":
    "Set the purchase and sale price for Queso and Yogurt. Records already created keep the sale price that was active when they were made — a new price only applies going forward.",
  "adminProducts.priceHistory": "Price History",
  "adminProducts.noHistory": "No price changes have been made yet.",
  "adminProducts.product": "Product",
  "adminProducts.purchasePrice": "Purchase price",
  "adminProducts.salePrice": "Sale price",
  "adminProducts.setBy": "Set by",
  "adminProducts.date": "Date",
  "adminProducts.purchasePriceBs": "Purchase price (Bs)",
  "adminProducts.salePriceBs": "Sale price (Bs)",
  "adminProducts.savePrice": "Save price",
  "adminProducts.saving": "Saving…",
  "adminProducts.priceUpdated": "Price updated.",
  "adminProducts.currentInfo": "Current: purchase {purchase}, sale {sale}",
  "adminProducts.setByInfo": " — set by {name} on {date}",
  "adminProducts.notSetYet": " (default, not yet set)",
} as const;

type DictionaryKey = keyof typeof en;

const es: Record<DictionaryKey, string> = {
  "header.home": "Inicio",
  "header.dashboard": "Panel",
  "header.manageUsers": "Gestionar usuarios",
  "header.productPrices": "Precios de productos",
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
  "adminSettings.productPrices.label": "Precios de productos",
  "adminSettings.productPrices.desc": "Costos, precios de venta, historial",
  "adminSettings.dashboard.label": "Panel completo",
  "adminSettings.dashboard.desc": "Totales, stock, registros de venta",

  "summaryCards.totalsSold": "Totales Vendidos",
  "summaryCards.remainingStock": "Stock Restante",
  "summaryCards.combined": "Combinado",
  "summaryCards.combinedValue": "Valor combinado",
  "summaryCards.units": "unidades",

  "table.user": "Usuario",
  "table.queso": "Queso",
  "table.yogurt": "Yogurt",
  "table.milkMote": "Leche y Mote",
  "table.totalRevenue": "Ingreso total",
  "table.edit": "Editar",

  "cell.sold": "{amount} vendido",
  "cell.soldWithRevenue": "{sold} vendido ({revenue})",
  "cell.takenLeft": "{taken} tomado · {remaining} restante ({remainingValue})",
  "cell.leftValue": "{left} restante, valor {total}",
  "cell.winner": "Ganador",
  "cell.winnerMargin": "Ganador (+{margin})",

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
  "adminUsers.noVehicle": "Sin vehículo",
  "adminUsers.active": "Activo",
  "adminUsers.inactive": "Inactivo",
  "adminUsers.deactivate": "Desactivar cuenta",
  "adminUsers.reactivate": "Reactivar cuenta",
  "adminUsers.vehicle": "Vehículo",
  "adminUsers.newPassword": "Nueva contraseña (déjalo en blanco para mantener la actual)",
  "adminUsers.saveChanges": "Guardar cambios",
  "adminUsers.saving": "Guardando…",
  "adminUsers.saved": "Guardado.",

  "adminProducts.backToDashboard": "← Volver al panel",
  "adminProducts.heading": "Precios de Productos",
  "adminProducts.subheading":
    "Establece el precio de compra y venta para Queso y Yogurt. Los registros ya creados mantienen el precio de venta vigente al momento de crearse — un nuevo precio solo aplica hacia adelante.",
  "adminProducts.priceHistory": "Historial de Precios",
  "adminProducts.noHistory": "Aún no se han realizado cambios de precio.",
  "adminProducts.product": "Producto",
  "adminProducts.purchasePrice": "Precio de compra",
  "adminProducts.salePrice": "Precio de venta",
  "adminProducts.setBy": "Establecido por",
  "adminProducts.date": "Fecha",
  "adminProducts.purchasePriceBs": "Precio de compra (Bs)",
  "adminProducts.salePriceBs": "Precio de venta (Bs)",
  "adminProducts.savePrice": "Guardar precio",
  "adminProducts.saving": "Guardando…",
  "adminProducts.priceUpdated": "Precio actualizado.",
  "adminProducts.currentInfo": "Actual: compra {purchase}, venta {sale}",
  "adminProducts.setByInfo": " — establecido por {name} el {date}",
  "adminProducts.notSetYet": " (predeterminado, aún no establecido)",
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
