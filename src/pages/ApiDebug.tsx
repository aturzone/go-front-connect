import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Bug, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { getApiConfig } from "@/lib/api";

export default function ApiDebug() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const testApiConnection = async () => {
    setTesting(true);
    const config = getApiConfig();

    if (!config) {
      toast.error("API not configured");
      setTesting(false);
      return;
    }

    const testResults = {
      config: {
        baseUrl: config.baseUrl,
        hasPassword: !!config.ownerPassword,
        passwordLength: config.ownerPassword?.length || 0,
      },
      tests: [] as any[],
    };

    // Test 1: Simple fetch without auth
    try {
      const response = await fetch(`${config.baseUrl}/health`);
      const data = await response.text();
      
      testResults.tests.push({
        name: "Health Check (No Auth)",
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        corsHeaders: {
          'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
          'access-control-allow-headers': response.headers.get('access-control-allow-headers'),
          'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
        },
        data: data.substring(0, 200),
      });
    } catch (error: any) {
      testResults.tests.push({
        name: "Health Check (No Auth)",
        success: false,
        error: error.message,
        note: "This usually means CORS is not configured or network issue",
      });
    }

    // Test 2: Fetch with auth header
    try {
      const response = await fetch(`${config.baseUrl}/users`, {
        headers: {
          'X-Owner-Password': config.ownerPassword,
          'Content-Type': 'application/json',
        },
      });
      
      testResults.tests.push({
        name: "Get Users (With Auth)",
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        corsHeaders: {
          'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
        },
      });
    } catch (error: any) {
      testResults.tests.push({
        name: "Get Users (With Auth)",
        success: false,
        error: error.message,
      });
    }

    // Test 3: Preflight (OPTIONS) request
    try {
      const response = await fetch(`${config.baseUrl}/users`, {
        method: 'OPTIONS',
        headers: {
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'X-Owner-Password,Content-Type',
          'Origin': window.location.origin,
        },
      });
      
      testResults.tests.push({
        name: "CORS Preflight (OPTIONS)",
        success: response.ok,
        status: response.status,
        corsHeaders: {
          'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
          'access-control-allow-headers': response.headers.get('access-control-allow-headers'),
          'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
        },
      });
    } catch (error: any) {
      testResults.tests.push({
        name: "CORS Preflight (OPTIONS)",
        success: false,
        error: error.message,
        note: "CORS preflight failed - server needs to handle OPTIONS requests",
      });
    }

    setResults(testResults);
    setTesting(false);
  };

  const getTestIcon = (success: boolean) => {
    return success ? (
      <CheckCircle2 className="h-5 w-5 text-success" />
    ) : (
      <XCircle className="h-5 w-5 text-destructive" />
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Bug className="h-8 w-8" />
          API Debug & Diagnostics
        </h1>
        <p className="text-muted-foreground">
          Test and troubleshoot your API connection
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connection Test</CardTitle>
          <CardDescription>
            Run comprehensive tests to identify connection issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={testApiConnection} disabled={testing} className="w-full">
            {testing ? "Testing..." : "Run Diagnostic Tests"}
          </Button>
        </CardContent>
      </Card>

      {results && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Base URL:</span>
                <code className="text-sm bg-muted px-2 py-1 rounded">
                  {results.config.baseUrl}
                </code>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Password Configured:</span>
                <Badge variant={results.config.hasPassword ? "default" : "destructive"}>
                  {results.config.hasPassword ? "Yes" : "No"}
                </Badge>
              </div>
              {results.config.hasPassword && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Password Length:</span>
                  <span className="text-sm">{results.config.passwordLength} characters</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {results.tests.map((test: any, index: number) => (
                <div key={index} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getTestIcon(test.success)}
                      <span className="font-medium">{test.name}</span>
                    </div>
                    {test.status && (
                      <Badge variant={test.success ? "default" : "destructive"}>
                        {test.status} {test.statusText}
                      </Badge>
                    )}
                  </div>

                  {test.error && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded p-2">
                      <p className="text-sm text-destructive font-medium">Error:</p>
                      <p className="text-sm text-destructive/80">{test.error}</p>
                    </div>
                  )}

                  {test.note && (
                    <div className="bg-warning/10 border border-warning/20 rounded p-2">
                      <p className="text-sm text-warning-foreground">{test.note}</p>
                    </div>
                  )}

                  {test.corsHeaders && (
                    <div className="bg-muted rounded p-2">
                      <p className="text-xs font-medium mb-1">CORS Headers:</p>
                      <div className="space-y-1">
                        {Object.entries(test.corsHeaders).map(([key, value]: [string, any]) => (
                          <div key={key} className="text-xs flex justify-between">
                            <span className="text-muted-foreground">{key}:</span>
                            <code className="text-xs">
                              {value || <span className="text-destructive">Not Set</span>}
                            </code>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {test.data && (
                    <div className="bg-muted rounded p-2">
                      <p className="text-xs font-medium mb-1">Response:</p>
                      <code className="text-xs break-all">{test.data}</code>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-warning/50 bg-warning/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-warning" />
                Common Issues & Solutions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="font-medium mb-1">❌ Error: "Failed to fetch" or "Network error"</p>
                <p className="text-muted-foreground">
                  This means the server is not reachable or CORS is not configured. 
                  Make sure the server is running and accessible.
                </p>
              </div>

              <div>
                <p className="font-medium mb-1">❌ Status 401 (Unauthorized)</p>
                <p className="text-muted-foreground">
                  The X-Owner-Password header might not be reaching the server or is incorrect.
                  Check your password in Settings.
                </p>
              </div>

              <div>
                <p className="font-medium mb-1">🔧 CORS Configuration Required</p>
                <p className="text-muted-foreground mb-2">
                  Your server needs to return these headers:
                </p>
                <div className="bg-muted rounded p-2 space-y-1 font-mono text-xs">
                  <div>Access-Control-Allow-Origin: {window.location.origin}</div>
                  <div>Access-Control-Allow-Headers: X-Owner-Password, Content-Type</div>
                  <div>Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS</div>
                </div>
                <p className="text-muted-foreground mt-2">
                  Current origin: <code className="bg-muted px-1 rounded">{window.location.origin}</code>
                </p>
              </div>

              <div>
                <p className="font-medium mb-1">✅ If tests pass but pages fail</p>
                <p className="text-muted-foreground">
                  Check browser console (F12) for detailed error messages.
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
