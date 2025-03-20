
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Spinner } from "@/components/ui/spinner";
import { UserFilter } from "./UserFilter";
import { UserEditDialog } from "./UserEditDialog";

interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
}

export function UserTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const pageSize = 10;

  useEffect(() => {
    fetchUsers();
  }, [page, filter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Build query to fetch users with optional filtering
      let query = supabase
        .from('profiles')
        .select('id, email, first_name, last_name, created_at', { count: 'exact' });
      
      // Apply filter if it exists
      if (filter) {
        query = query.or(`email.ilike.%${filter}%,first_name.ilike.%${filter}%,last_name.ilike.%${filter}%`);
      }
      
      // Fetch paginated results
      const { data, count, error } = await query
        .range((page - 1) * pageSize, page * pageSize - 1)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }

      setUsers(data || []);
      
      // Calculate total pages
      if (count !== null) {
        setTotalPages(Math.ceil(count / pageSize));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <UserFilter onFilterChange={(value) => setFilter(value)} />
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  <div className="flex justify-center">
                    <Spinner className="h-6 w-6" />
                  </div>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow 
                  key={user.id} 
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => handleUserClick(user)}
                >
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>
                    {user.first_name || user.last_name 
                      ? `${user.first_name || ''} ${user.last_name || ''}`.trim() 
                      : 'Not provided'}
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => Math.abs(p - page) < 2 || p === 1 || p === totalPages)
              .map((p, i, arr) => {
                // Add ellipsis
                if (i > 0 && p > arr[i - 1] + 1) {
                  return (
                    <PaginationItem key={`ellipsis-${p}`}>
                      <PaginationLink>...</PaginationLink>
                    </PaginationItem>
                  );
                }
                
                return (
                  <PaginationItem key={p}>
                    <PaginationLink 
                      isActive={page === p}
                      onClick={() => setPage(p)}
                      className="cursor-pointer"
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className={page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <UserEditDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        user={selectedUser} 
        onUserUpdated={fetchUsers}
      />
    </div>
  );
}
