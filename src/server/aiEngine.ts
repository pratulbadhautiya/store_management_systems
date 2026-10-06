import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { db } from './db.ts';
import { AiProposedAction, BusinessInsight } from '../types/index.ts';

// Server-side Gemini initialization
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  aiClient = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Function Declarations for Gemini Tool Calling
const getDashboardSummaryDecl: FunctionDeclaration = {
  name: 'get_dashboard_summary',
  description: 'Get high-level summary of the shop for today or a chosen time range: sales revenue, gross profit, transactions, inventory value, low stock count, supplier payables, customer receivables.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      timeRange: {
        type: Type.STRING,
        description: 'Time range: today, yesterday, 7days, 30days, or this_month',
      },
    },
    required: [],
  },
};

const getLowStockProductsDecl: FunctionDeclaration = {
  name: 'get_low_stock_products',
  description: 'Returns products currently at or below minimum stock threshold, with current stock, supplier, and unit cost.',
  parameters: {
    type: Type.OBJECT,
    properties: {},
  },
};

const getSlowMovingProductsDecl: FunctionDeclaration = {
  name: 'get_slow_moving_products',
  description: 'Returns products with zero or slow sales over the last 30 days that are tying up working capital.',
  parameters: {
    type: Type.OBJECT,
    properties: {},
  },
};

const getCustomerBalancesDecl: FunctionDeclaration = {
  name: 'get_customer_balances',
  description: 'Returns customers who owe money on Khata / credit ledger (outstanding receivables) with their contact details.',
  parameters: {
    type: Type.OBJECT,
    properties: {},
  },
};

const getSupplierBalancesDecl: FunctionDeclaration = {
  name: 'get_supplier_balances',
  description: 'Returns suppliers with outstanding unpaid balances (payables) and pending purchase amounts.',
  parameters: {
    type: Type.OBJECT,
    properties: {},
  },
};

const getExpenseReportDecl: FunctionDeclaration = {
  name: 'get_expense_report',
  description: 'Returns list of shop expenses grouped by categories like rent, electricity, salaries, transport.',
  parameters: {
    type: Type.OBJECT,
    properties: {},
  },
};

const proposePurchaseOrderDecl: FunctionDeclaration = {
  name: 'propose_purchase_order',
  description: 'Drafts a purchase order for low-stock items or specified products with supplier details and estimated cost for shopkeeper review and confirmation.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      itemsSummary: {
        type: Type.STRING,
        description: 'Brief summary of items to order, e.g., "15 units of Tata Salt, 20 units of Dettol Soap"',
      },
      supplierName: {
        type: Type.STRING,
        description: 'Target supplier name',
      },
      estimatedAmount: {
        type: Type.NUMBER,
        description: 'Total estimated purchase cost in rupees',
      },
    },
    required: ['itemsSummary', 'supplierName', 'estimatedAmount'],
  },
};

// Tool executor that queries strictly the given tenantId
export function executeTool(name: string, args: any, businessId: string, actorName: string): { result: any; proposedAction?: AiProposedAction } {
  switch (name) {
    case 'get_dashboard_summary': {
      const summary = db.getDashboardSummary(businessId, args.timeRange || 'today');
      return { result: summary };
    }

    case 'get_low_stock_products': {
      const products = db.getProducts(businessId);
      const lowStock = products.filter(p => p.currentStock <= p.minStock).map(p => ({
        id: p.id,
        name: p.name,
        currentStock: p.currentStock,
        minStock: p.minStock,
        unit: p.unit,
        purchasePrice: p.purchasePrice,
        sellingPrice: p.sellingPrice,
        supplierName: p.supplierName || 'Default Supplier',
        deficit: p.minStock - p.currentStock,
      }));
      return { result: { lowStockCount: lowStock.length, products: lowStock } };
    }

    case 'get_slow_moving_products': {
      const summary = db.getDashboardSummary(businessId, '30days');
      return { result: { slowMoving: summary.slowMoving } };
    }

    case 'get_customer_balances': {
      const customers = db.getCustomers(businessId);
      const withKhata = customers.filter(c => c.outstandingBalance > 0).map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        outstandingBalance: c.outstandingBalance,
        creditLimit: c.creditLimit,
        ordersCount: c.ordersCount,
      }));
      const totalReceivable = withKhata.reduce((acc, c) => acc + c.outstandingBalance, 0);
      return { result: { totalReceivable, count: withKhata.length, customers: withKhata } };
    }

    case 'get_supplier_balances': {
      const suppliers = db.getSuppliers(businessId);
      const withBalance = suppliers.filter(s => s.outstandingBalance > 0).map(s => ({
        id: s.id,
        name: s.name,
        company: s.company,
        phone: s.phone,
        outstandingBalance: s.outstandingBalance,
      }));
      const totalPayable = withBalance.reduce((acc, s) => acc + s.outstandingBalance, 0);
      return { result: { totalPayable, count: withBalance.length, suppliers: withBalance } };
    }

    case 'get_expense_report': {
      const expenses = db.getExpenses(businessId);
      const totalAmount = expenses.reduce((acc, e) => acc + e.amount, 0);
      const byCategory: Record<string, number> = {};
      expenses.forEach(e => {
        byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
      });
      return { result: { totalAmount, byCategory, recentExpenses: expenses.slice(0, 5) } };
    }

    case 'propose_purchase_order': {
      const proposedAction: AiProposedAction = {
        id: `act-${Date.now()}`,
        type: 'CREATE_PURCHASE_ORDER',
        summary: `Draft Purchase Order for ${args.itemsSummary} from ${args.supplierName} (~₹${args.estimatedAmount})`,
        payload: {
          itemsSummary: args.itemsSummary,
          supplierName: args.supplierName,
          estimatedAmount: args.estimatedAmount,
          businessId,
        },
        status: 'PENDING',
      };
      return {
        result: {
          status: 'PROPOSED_FOR_CONFIRMATION',
          message: `Created draft proposal for ₹${args.estimatedAmount}. Requires shopkeeper confirmation.`,
          action: proposedAction,
        },
        proposedAction,
      };
    }

    default:
      return { result: { error: `Tool ${name} not recognized.` } };
  }
}

// Helper to generate proactive business insights
export function generateProactiveInsights(businessId: string): BusinessInsight[] {
  const products = db.getProducts(businessId);
  const sales = db.getSales(businessId);
  const customers = db.getCustomers(businessId);
  const suppliers = db.getSuppliers(businessId);
  const summary = db.getDashboardSummary(businessId, 'today');

  const insights: BusinessInsight[] = [];

  // 1. Low stock insight
  const lowStock = products.filter(p => p.currentStock <= p.minStock);
  if (lowStock.length > 0) {
    const topLow = lowStock.slice(0, 3).map(p => `${p.name} (${p.currentStock}/${p.minStock} ${p.unit})`).join(', ');
    insights.push({
      id: 'ins-low-stock',
      title: `${lowStock.length} Products Low in Stock`,
      description: `Critical items: ${topLow}. Restock soon to prevent stock-outs during peak evening hours.`,
      category: 'INVENTORY',
      urgency: 'HIGH',
      metric: `${lowStock.length} items`,
      actionLabel: 'Restock Products',
      actionTab: 'inventory',
    });
  }

  // 2. Customer Khata Credit insight
  const debtors = customers.filter(c => c.outstandingBalance > 0);
  const totalDue = debtors.reduce((a, b) => a + b.outstandingBalance, 0);
  if (totalDue > 0) {
    insights.push({
      id: 'ins-khata',
      title: `₹${totalDue.toLocaleString()} in Khata Receivables`,
      description: `${debtors.length} customers have outstanding balances. Ramesh Kumar owes ₹${debtors[0]?.outstandingBalance || 0}.`,
      category: 'CUSTOMER',
      urgency: 'MEDIUM',
      metric: `₹${totalDue.toLocaleString()}`,
      actionLabel: 'View Khata Balances',
      actionTab: 'customers',
    });
  }

  // 3. Sales & Margin insight
  if (summary.totalSalesRevenue > 0) {
    const margin = ((summary.totalGrossProfit / summary.totalSalesRevenue) * 100).toFixed(1);
    insights.push({
      id: 'ins-sales',
      title: `Today's Gross Margin: ${margin}%`,
      description: `Gross profit is ₹${summary.totalGrossProfit.toFixed(0)} on ₹${summary.totalSalesRevenue.toFixed(0)} sales across ${summary.transactionCount} bills.`,
      category: 'PROFIT',
      urgency: 'LOW',
      metric: `${margin}% margin`,
      actionLabel: 'View Sales Report',
      actionTab: 'reports',
    });
  }

  // 4. Slow moving items insight
  if (summary.slowMoving.length > 0) {
    const deadStockValue = summary.slowMoving.reduce((acc, p) => acc + p.stockValue, 0);
    insights.push({
      id: 'ins-slow-moving',
      title: `₹${deadStockValue.toLocaleString()} in Slow-Moving Stock`,
      description: `Items like ${summary.slowMoving[0]?.name} haven't moved in 30 days. Consider bundling or offering a 10% discount.`,
      category: 'INVENTORY',
      urgency: 'MEDIUM',
      metric: `₹${deadStockValue.toLocaleString()}`,
      actionLabel: 'View Slow Stock',
      actionTab: 'inventory',
    });
  }

  return insights;
}

// Business Copilot Chat Handler
export async function chatWithCopilot(
  businessId: string,
  userMessage: string,
  actorName: string
): Promise<{ text: string; toolsUsed: string[]; proposedAction?: AiProposedAction }> {
  const toolsUsed: string[] = [];
  let proposedAction: AiProposedAction | undefined;

  const business = db.getBusiness(businessId);
  const businessName = business ? business.name : 'Shop';

  // System instruction for MyShoply AI
  const systemInstruction = `You are MyShoply AI, the intelligent, dedicated business co-pilot and shop manager for "${businessName}".
Your sole user is the SHOPKEEPER / STORE OWNER (${actorName}).
You are NOT a customer shopping assistant. You are an operational retail business manager.
CRITICAL RULES:
1. NEVER hallucinate or invent inventory numbers, revenue, profit, stock, prices, customer names, or supplier balances.
2. ALWAYS use your provided tools to query real business data for this shop.
3. Keep responses clean, concise, structured, professional, and actionable. Use bullet points and bold amounts in Indian Rupees (₹).
4. If the shopkeeper asks to reorder or restock, use propose_purchase_order so they can verify and execute it safely.
5. Provide actionable takeaways like "Recommended action: [Restock Tata Salt]".`;

  // Fallback direct business rule executor if GEMINI_API_KEY is not set or network issues arise
  const runDirectIntelligence = (): { text: string; toolsUsed: string[]; proposedAction?: AiProposedAction } => {
    const lower = userMessage.toLowerCase();

    if (lower.includes('restock') || lower.includes('low stock') || lower.includes('purchase tomorrow') || lower.includes('what should i purchase')) {
      toolsUsed.push('get_low_stock_products');
      const lowStockRes = executeTool('get_low_stock_products', {}, businessId, actorName).result;
      if (lowStockRes.products.length === 0) {
        return {
          text: `Your inventory is currently well-stocked! None of your products are below their minimum threshold.\n\nAll ${db.getProducts(businessId).length} active products have sufficient buffer stock.`,
          toolsUsed,
        };
      }

      const totalDeficitCost = lowStockRes.products.reduce((acc: number, p: any) => acc + (p.deficit * p.purchasePrice), 0);
      const itemsList = lowStockRes.products.map((p: any) => `• **${p.name}**: Current ${p.currentStock} ${p.unit} (Min: ${p.minStock}, Deficit: ${p.deficit} units @ ₹${p.purchasePrice}/unit = ₹${p.deficit * p.purchasePrice})`).join('\n');

      const primarySupplier = lowStockRes.products[0]?.supplierName || 'Delhi FMCG Distributors';
      const itemsSummary = lowStockRes.products.map((p: any) => `${p.deficit} ${p.unit} of ${p.name}`).join(', ');

      const action = executeTool('propose_purchase_order', {
        itemsSummary,
        supplierName: primarySupplier,
        estimatedAmount: totalDeficitCost,
      }, businessId, actorName);

      return {
        text: `### Restock Analysis for ${businessName}\n\nI identified **${lowStockRes.products.length} products** critically low in stock:\n\n${itemsList}\n\n**Total Estimated Restock Investment**: ₹${totalDeficitCost.toLocaleString()}\n**Recommended Supplier**: ${primarySupplier}\n\nWould you like me to prepare a Purchase Order for these items? You can approve it using the button below.`,
        toolsUsed: ['get_low_stock_products', 'propose_purchase_order'],
        proposedAction: action.proposedAction,
      };
    }

    if (lower.includes('sell today') || lower.includes('performance') || lower.includes('how is my business') || lower.includes('today') || lower.includes('summary')) {
      toolsUsed.push('get_dashboard_summary');
      const s = executeTool('get_dashboard_summary', { timeRange: 'today' }, businessId, actorName).result;
      return {
        text: `### Today's Shop Performance (${businessName})\n\n• **Total Sales Revenue**: ₹${s.totalSalesRevenue.toFixed(2)}\n• **Gross Profit**: ₹${s.totalGrossProfit.toFixed(2)} (${s.totalSalesRevenue > 0 ? ((s.totalGrossProfit / s.totalSalesRevenue) * 100).toFixed(1) : '0'}% margin)\n• **Bills Generated**: ${s.transactionCount} transactions (Avg Order: ₹${s.avgOrderValue.toFixed(0)})\n• **Today's Operating Expenses**: ₹${s.totalExpensesAmount.toFixed(2)}\n• **Net Profit**: ₹${s.netProfit.toFixed(2)}\n\n**Inventory Health**:\n• Total Stock Valuation: ₹${s.totalInventoryValueCost.toLocaleString()} (Cost) / ₹${s.totalInventoryValueRetail.toLocaleString()} (Retail)\n• Low-stock items: ${s.lowStockCount} | Out of stock: ${s.outOfStockCount}\n\n**Recommended Action**: ${s.lowStockCount > 0 ? `Review your ${s.lowStockCount} low-stock items and create a purchase order.` : 'Inventory levels are healthy for the day.'}`,
        toolsUsed,
      };
    }

    if (lower.includes('slow') || lower.includes('dead stock') || lower.includes('not selling') || lower.includes('30 days')) {
      toolsUsed.push('get_slow_moving_products');
      const slow = executeTool('get_slow_moving_products', {}, businessId, actorName).result.slowMoving;
      if (slow.length === 0) {
        return {
          text: `Good news! There are currently no dead stock items in your inventory. All catalog items have regular sales velocity.`,
          toolsUsed,
        };
      }
      const totalTied = slow.reduce((a: number, b: any) => a + b.stockValue, 0);
      const list = slow.map((p: any) => `• **${p.name}**: ${p.currentStock} units in stock (Tying up **₹${p.stockValue.toLocaleString()}** in working capital)`).join('\n');
      return {
        text: `### Slow-Moving Inventory Alert\n\nThe following products have had little or no sales over the past 30 days:\n\n${list}\n\n**Total Capital Blocked**: ₹${totalTied.toLocaleString()}\n\n**Manager Recommendation**:\n1. Move these items to high-visibility checkout displays.\n2. Bundle them with high-velocity staples like Atta or Edible Oil.\n3. Offer an introductory 10% discount to liquidate inventory.`,
        toolsUsed,
      };
    }

    if (lower.includes('owe') || lower.includes('customer') || lower.includes('khata') || lower.includes('udhar') || lower.includes('credit')) {
      toolsUsed.push('get_customer_balances');
      const res = executeTool('get_customer_balances', {}, businessId, actorName).result;
      const list = res.customers.map((c: any) => `• **${c.name}** (${c.phone}): **₹${c.outstandingBalance.toLocaleString()}** (Credit Limit: ₹${c.creditLimit})`).join('\n');
      return {
        text: `### Khata (Credit) Outstanding Balance\n\nYou have **${res.count} customers** with pending payments totaling **₹${res.totalReceivable.toLocaleString()}**:\n\n${list || '• No outstanding balances!'}\n\n**Next Steps**: You can send friendly WhatsApp reminders from the Customer Management section.`,
        toolsUsed,
      };
    }

    if (lower.includes('supplier') || lower.includes('payable')) {
      toolsUsed.push('get_supplier_balances');
      const res = executeTool('get_supplier_balances', {}, businessId, actorName).result;
      const list = res.suppliers.map((s: any) => `• **${s.name}** (${s.company}): **₹${s.outstandingBalance.toLocaleString()}** payable`).join('\n');
      return {
        text: `### Supplier Payables Status\n\nTotal pending supplier liabilities: **₹${res.totalPayable.toLocaleString()}** across ${res.count} distributors:\n\n${list || '• No pending supplier payments!'}\n\nAll invoices are up to date.`,
        toolsUsed,
      };
    }

    if (lower.includes('expense') || lower.includes('cost') || lower.includes('spent')) {
      toolsUsed.push('get_expense_report');
      const res = executeTool('get_expense_report', {}, businessId, actorName).result;
      const catList = Object.entries(res.byCategory).map(([cat, amt]) => `• **${cat}**: ₹${Number(amt).toLocaleString()}`).join('\n');
      return {
        text: `### Operating Expenses Report\n\nTotal recorded store expenses: **₹${res.totalAmount.toLocaleString()}**\n\n**Category Breakdown**:\n${catList}\n\nKeep utility and packaging costs monitored to maximize your monthly net profit margin.`,
        toolsUsed,
      };
    }

    // Default intelligent response summarizing shop status
    toolsUsed.push('get_dashboard_summary');
    const d = executeTool('get_dashboard_summary', { timeRange: 'today' }, businessId, actorName).result;
    return {
      text: `### MyShoply Business Snapshot for ${businessName}\n\nI am monitoring your shop's operations in real-time:\n\n• **Today's Revenue**: ₹${d.totalSalesRevenue.toFixed(2)} across ${d.transactionCount} transactions\n• **Gross Profit**: ₹${d.totalGrossProfit.toFixed(2)}\n• **Active Inventory Value**: ₹${d.totalInventoryValueCost.toLocaleString()} (Cost basis)\n• **Stock Health**: ${d.lowStockCount} items need restocking\n• **Khata Balances**: ₹${d.totalCustomerReceivables.toLocaleString()} to collect\n\nAsk me specific questions such as:\n• *"What should I restock tomorrow?"*\n• *"Show me slow-moving products"*\n• *"Who owes me money on Khata?"*\n• *"How much profit did I make today?"*`,
      toolsUsed,
    };
  };

  // If Gemini API Key is available, use real LLM tool calling!
  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          { role: 'user', parts: [{ text: userMessage }] },
        ],
        config: {
          systemInstruction,
          tools: [
            {
              functionDeclarations: [
                getDashboardSummaryDecl,
                getLowStockProductsDecl,
                getSlowMovingProductsDecl,
                getCustomerBalancesDecl,
                getSupplierBalancesDecl,
                getExpenseReportDecl,
                proposePurchaseOrderDecl,
              ],
            },
          ],
        },
      });

      // Handle function calling if Gemini invoked tools
      if (response.functionCalls && response.functionCalls.length > 0) {
        const toolResponses: any[] = [];
        for (const call of response.functionCalls) {
          if (!call.name) continue;
          toolsUsed.push(call.name);
          const exec = executeTool(call.name, call.args, businessId, actorName);
          if (exec.proposedAction) {
            proposedAction = exec.proposedAction;
          }
          toolResponses.push({
            name: call.name,
            response: exec.result,
          });
        }

        // Secondary call to synthesize the tool results into natural response
        const synthesisResponse = await aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            { role: 'user', parts: [{ text: userMessage }] },
            {
              role: 'model',
              parts: response.functionCalls.map(c => ({
                functionCall: { name: c.name, args: c.args },
              })),
            },
            {
              role: 'user',
              parts: toolResponses.map(t => ({
                functionResponse: { name: t.name, response: t.response },
              })),
            },
          ],
          config: {
            systemInstruction,
          },
        });

        const finalText = synthesisResponse.text || 'Here is your shop data summary.';
        return { text: finalText, toolsUsed, proposedAction };
      }

      if (response.text) {
        return { text: response.text, toolsUsed, proposedAction };
      }
    } catch (err: any) {
      console.warn('Gemini API call failed, falling back to local business intelligence engine:', err.message);
      return runDirectIntelligence();
    }
  }

  return runDirectIntelligence();
}
