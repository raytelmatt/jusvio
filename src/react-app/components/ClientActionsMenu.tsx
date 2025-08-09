import { useState } from 'react';
import { Link } from 'react-router';
import { 
  MoreHorizontal, 
  Edit, 
  Eye, 
  Mail, 
  Phone, 
  FolderOpen,
  Settings,
  Trash2
} from 'lucide-react';
import type { Client } from '@/shared/types';

interface ClientActionsMenuProps {
  client: Client;
  onUpdate: () => void;
}

export default function ClientActionsMenu({ client, onUpdate }: ClientActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const togglePortalAccess = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...client,
          portal_enabled: !client.portal_enabled,
        }),
      });

      if (response.ok) {
        onUpdate();
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Error updating client:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendEmail = () => {
    if (client.email) {
      window.location.href = `mailto:${client.email}`;
    }
    setIsOpen(false);
  };

  const callClient = () => {
    if (client.phones) {
      const phones = JSON.parse(client.phones);
      if (phones.length > 0) {
        window.location.href = `tel:${phones[0]}`;
      }
    }
    setIsOpen(false);
  };

  const deleteClient = async () => {
    if (!confirm(`Are you sure you want to delete ${client.first_name} ${client.last_name}? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error deleting client:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
        disabled={loading}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="py-1">
              <Link
                to={`/clients/${client.id}`}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Link>

              <Link
                to={`/clients/${client.id}/edit`}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Client
              </Link>

              <Link
                to={`/matters?client_id=${client.id}`}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
              >
                <FolderOpen className="mr-2 h-4 w-4" />
                View Matters
              </Link>

              <div className="border-t border-gray-100 my-1" />

              {client.email && (
                <button
                  onClick={sendEmail}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Send Email
                </button>
              )}

              {client.phones && (
                <button
                  onClick={callClient}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Call Client
                </button>
              )}

              <div className="border-t border-gray-100 my-1" />

              <button
                onClick={togglePortalAccess}
                disabled={loading}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                <Settings className="mr-2 h-4 w-4" />
                {client.portal_enabled ? 'Disable Portal' : 'Enable Portal'}
              </button>

              <div className="border-t border-gray-100 my-1" />

              <button
                onClick={deleteClient}
                disabled={loading}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Client
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
