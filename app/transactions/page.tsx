"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { transactionApi, clientApi } from "@/lib/api"
import { Receipt, Plus, RefreshCw, CheckCircle2, XCircle, Search, Eye, Check, X, IndianRupee } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export default function TransactionsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [clientFilter, setClientFilter] = useState<string>("all")
  const [verifyingId, setVerifyingId] = useState<string | null>(null)

  const [createData, setCreateData] = useState({
    client_id: "",
    transaction_id: "",
    amount: "",
    payment_method: "",
    notes: "",
  })
  
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")

  useEffect(() => {
    fetchTransactions()
    fetchClients()
  }, [])

  const fetchClients = async () => {
    const response = await clientApi.list()
    if (response.data) {
      setClients(Array.isArray(response.data) ? response.data : [])
    }
  }

  const fetchTransactions = async () => {
    setLoading(true)
    const params: any = {}
    if (clientFilter !== "all") {
      params.client_id = clientFilter
    }
    if (statusFilter !== "all") {
      params.status = statusFilter
    }
    const response = await transactionApi.list(params)
    if (response.data) {
      setTransactions(Array.isArray(response.data) ? response.data : [])
    } else {
      setMessage({ type: "error", text: response.error || "Failed to fetch transactions" })
    }
    setLoading(false)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    // Convert amount to number, preserving exact value (avoid floating point precision issues)
    const amountValue = createData.amount.trim()
    const amount = amountValue ? Number(amountValue) : 0
    
    if (isNaN(amount) || amount <= 0) {
      setMessage({ type: "error", text: "Please enter a valid amount greater than 0" })
      setLoading(false)
      return
    }

    const response = await transactionApi.create({
      client_id: createData.client_id,
      transaction_id: createData.transaction_id,
      amount: amount,
      payment_method: createData.payment_method || undefined,
      created_by_user_id: user?.id || undefined,
      notes: createData.notes || undefined,
    })
    
    if (response.error) {
      setMessage({ type: "error", text: response.error })
    } else {
      setMessage({ type: "success", text: "Transaction created successfully!" })
      setCreateData({ client_id: "", transaction_id: "", amount: "", payment_method: "", notes: "" })
      setShowCreate(false)
      fetchTransactions()
    }
    setLoading(false)
  }

  const handleVerify = async (transactionId: string, status: "verified" | "rejected", rejectionReasonText?: string) => {
    console.log("handleVerify called:", { transactionId, status, user })
    
    // User object has 'id' not 'user_id' based on auth-context.tsx
    const userId = user?.id
    if (!userId) {
      console.error("User ID not found in user object:", user)
      setMessage({ type: "error", text: "User ID not found. Please refresh the page." })
      return
    }

    // Validate rejection reason is provided when rejecting
    if (status === "rejected" && !rejectionReasonText?.trim()) {
      setMessage({ type: "error", text: "Please provide a reason for rejection" })
      return
    }

    setVerifyingId(transactionId)
    setMessage(null)

    try {
      console.log("Calling transactionApi.verify with:", { transactionId, status, verified_by_user_id: userId, rejection_reason: rejectionReasonText })
      const response = await transactionApi.verify(transactionId, {
        status,
        verified_by_user_id: userId,
        rejection_reason: status === "rejected" ? rejectionReasonText : undefined,
      })

      console.log("Verify response:", response)

      if (response.error) {
        setMessage({ type: "error", text: response.error })
      } else {
        setMessage({ type: "success", text: `Transaction ${status} successfully!` })
        setRejectingId(null)
        setRejectionReason("")
        fetchTransactions()
      }
    } catch (error) {
      console.error("Error verifying transaction:", error)
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to verify transaction" })
    } finally {
      setVerifyingId(null)
    }
  }
  
  const handleRejectClick = (transactionId: string) => {
    setRejectingId(transactionId)
    setRejectionReason("")
  }
  
  const handleRejectCancel = () => {
    setRejectingId(null)
    setRejectionReason("")
  }
  
  const handleRejectConfirm = (transactionId: string) => {
    if (!rejectionReason.trim()) {
      setMessage({ type: "error", text: "Please provide a reason for rejection" })
      return
    }
    handleVerify(transactionId, "rejected", rejectionReason)
  }

  const filteredTransactions = transactions.filter((transaction) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      transaction.transaction_id?.toLowerCase().includes(query) ||
      transaction.client_id?.toLowerCase().includes(query) ||
      transaction.amount?.toString().includes(query)
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Receipt className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
              <p className="text-muted-foreground">
                Manage payment transactions and verifications
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={fetchTransactions}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button 
            type="button"
            onClick={() => setShowCreate(!showCreate)} 
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            {showCreate ? "Cancel" : "Add Transaction"}
          </Button>
        </div>
      </div>

      {/* Alert Message */}
      {message && (
        <Alert
          variant={message.type === "error" ? "destructive" : "default"}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Create Form */}
      {showCreate && (
        <Card className="border-2">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Create Transaction
            </CardTitle>
            <CardDescription>Add a new transaction record</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleCreate} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="client_id" className="text-sm font-semibold">
                  Client *
                </Label>
                <Select
                  value={createData.client_id}
                  onValueChange={(value) => setCreateData({ ...createData, client_id: value })}
                >
                  <SelectTrigger id="client_id" className="h-11">
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.client_id} value={client.client_id}>
                        {client.name} ({client.client_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="transaction_id" className="text-sm font-semibold">
                  Transaction ID *
                </Label>
                <Input
                  id="transaction_id"
                  placeholder="e.g., TXN123456789"
                  value={createData.transaction_id}
                  onChange={(e) => setCreateData({ ...createData, transaction_id: e.target.value })}
                  className="h-11 font-mono"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Enter the transaction ID from payment gateway
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="payment_method" className="text-sm font-semibold">
                  Payment Method
                </Label>
                <Select
                  value={createData.payment_method}
                  onValueChange={(value) => setCreateData({ ...createData, payment_method: value })}
                >
                  <SelectTrigger id="payment_method" className="h-11">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Credit Card">Credit Card</SelectItem>
                    <SelectItem value="Debit Card">Debit Card</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-semibold">
                  Amount (₹) *
                </Label>
                <Input
                  id="amount"
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={createData.amount}
                  onChange={(e) => {
                    // Allow only numbers and one decimal point
                    const value = e.target.value.replace(/[^0-9.]/g, '')
                    // Ensure only one decimal point
                    const parts = value.split('.')
                    const filteredValue = parts.length > 2 
                      ? parts[0] + '.' + parts.slice(1).join('')
                      : value
                    // Limit to 2 decimal places
                    if (filteredValue.includes('.')) {
                      const [intPart, decPart] = filteredValue.split('.')
                      const finalValue = decPart.length > 2 
                        ? intPart + '.' + decPart.substring(0, 2)
                        : filteredValue
                      setCreateData({ ...createData, amount: finalValue })
                    } else {
                      setCreateData({ ...createData, amount: filteredValue })
                    }
                  }}
                  className="h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-semibold">
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes about this transaction..."
                  value={createData.notes}
                  onChange={(e) => setCreateData({ ...createData, notes: e.target.value })}
                  rows={3}
                />
              </div>
              
              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" disabled={loading} className="gap-2">
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Create Transaction
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreate(false)
                    setCreateData({ client_id: "", transaction_id: "", amount: "", payment_method: "", notes: "" })
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="border-2">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Client</Label>
              <Select value={clientFilter} onValueChange={(value) => { setClientFilter(value); fetchTransactions() }}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.client_id} value={client.client_id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); fetchTransactions() }}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card className="border-2">
        <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                All Transactions
              </CardTitle>
              <CardDescription className="mt-1">
                {transactions.length} transaction{transactions.length !== 1 ? "s" : ""} found
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-sm">
              {filteredTransactions.length} shown
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {loading && transactions.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-40" />
                  <Skeleton className="h-12 flex-1" />
                  <Skeleton className="h-12 w-24" />
                  <Skeleton className="h-12 w-32" />
                </div>
              ))}
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground font-medium">
                {searchQuery ? "No transactions match your search" : "No transactions found"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery ? "Try a different search term" : "Create one to get started"}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Transaction ID</TableHead>
                    <TableHead className="font-semibold">Client</TableHead>
                    <TableHead className="font-semibold">Payment Method</TableHead>
                    <TableHead className="font-semibold">Amount</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Created By</TableHead>
                    <TableHead className="font-semibold">Verified By</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <code className="text-sm font-mono">{transaction.transaction_id}</code>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{transaction.client_id}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {transaction.payment_method || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-green-600">
                          ₹{parseFloat(transaction.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge 
                            variant={
                              transaction.status === "verified" ? "default" : 
                              transaction.status === "rejected" ? "destructive" : 
                              "secondary"
                            }
                          >
                            {transaction.status}
                          </Badge>
                          {transaction.status === "rejected" && transaction.rejection_reason && (
                            <div className="text-xs text-muted-foreground mt-1 max-w-xs">
                              <span className="font-medium">Reason: </span>
                              {transaction.rejection_reason}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {transaction.created_by_user_email ? (
                            <>
                              <div className="text-xs font-medium">{transaction.created_by_user_email}</div>
                              {transaction.created_by_user_id && (
                                <div className="text-xs text-muted-foreground">ID: {transaction.created_by_user_id.substring(0, 8)}...</div>
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">N/A</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {transaction.verified_by_user_email ? (
                            <>
                              <div className="text-xs font-medium">{transaction.verified_by_user_email}</div>
                              {transaction.verified_by_user_id && (
                                <div className="text-xs text-muted-foreground">ID: {transaction.verified_by_user_id.substring(0, 8)}...</div>
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(transaction.created_at).toLocaleDateString('en-IN')}
                      </TableCell>
                      <TableCell>
                        {transaction.status === "pending" && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleVerify(transaction.id, "verified")}
                              disabled={verifyingId === transaction.id}
                              className="gap-1 text-green-600"
                            >
                              <Check className="h-3 w-3" />
                              Verify
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRejectClick(transaction.id)}
                              disabled={verifyingId === transaction.id}
                              className="gap-1 text-red-600"
                            >
                              <X className="h-3 w-3" />
                              Reject
                            </Button>
                          </div>
                        )}
                        {transaction.status !== "pending" && (
                          <span className="text-xs text-muted-foreground">
                            {transaction.verified_at ? new Date(transaction.verified_at).toLocaleDateString('en-IN') : "-"}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Rejection Dialog */}
      <AlertDialog open={rejectingId !== null} onOpenChange={(open) => !open && handleRejectCancel()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting this transaction. This reason will be recorded and visible to all users.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection_reason">Rejection Reason *</Label>
              <Textarea
                id="rejection_reason"
                placeholder="Enter the reason for rejecting this transaction..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                This field is required when rejecting a transaction.
              </p>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleRejectCancel}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => rejectingId && handleRejectConfirm(rejectingId)}
              disabled={!rejectionReason.trim()}
            >
              Reject Transaction
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

