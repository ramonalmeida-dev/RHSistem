import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const ResetPasswordDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});

  const collectDebugInfo = async () => {
    const info: any = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      pathname: window.location.pathname,
      hash: window.location.hash,
      search: window.location.search,
    };

    // Parse hash params
    if (window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      info.hashParams = Object.fromEntries(hashParams);
    }

    // Parse search params
    if (window.location.search) {
      const searchParams = new URLSearchParams(window.location.search);
      info.searchParams = Object.fromEntries(searchParams);
    }

    // Get session
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      info.session = {
        exists: !!session,
        user: session?.user ? {
          id: session.user.id,
          email: session.user.email,
          user_metadata: session.user.user_metadata,
          app_metadata: session.user.app_metadata,
        } : null,
        error: error?.message,
      };
    } catch (err) {
      info.session = { error: err };
    }

    // Get user
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      info.user = {
        exists: !!user,
        user: user ? {
          id: user.id,
          email: user.email,
          user_metadata: user.user_metadata,
          app_metadata: user.app_metadata,
        } : null,
        error: error?.message,
      };
    } catch (err) {
      info.user = { error: err };
    }

    setDebugInfo(info);
  };

  useEffect(() => {
    collectDebugInfo();
  }, []);

  const handleRefresh = () => {
    collectDebugInfo();
  };

  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <Card className="mb-4 border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="text-sm text-yellow-800">
          🐛 Debug: Reset Password State
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Button 
            onClick={handleRefresh} 
            size="sm" 
            variant="outline"
            className="mb-2"
          >
            Refresh Debug Info
          </Button>
          <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-96">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResetPasswordDebug; 