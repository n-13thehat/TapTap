"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getSecurityManager } from '@/lib/security/SecurityManager';
import { getGDPRCompliance } from '@/lib/security/GDPRCompliance';
import { getSecureEnv } from '@/lib/security/SecureEnv';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Key,
  Database,
  Globe,
  Users,
  Activity,
  Clock,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Settings,
  Download,
  Upload,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  MapPin,
  Wifi,
  WifiOff,
  Zap,
  Cpu,
  HardDrive,
  Monitor,
  Smartphone,
  Server,
  Cloud,
  FileText,
  Mail,
  Phone,
  MessageSquare,
  Bell,
  BellOff,
  Info,
  AlertCircle,
  CheckSquare,
  Square,
  MoreHorizontal,
  ExternalLink,
  Copy,
  Trash2,
  Edit,
  Plus,
  Minus,
  X,
  Check
} from 'lucide-react';

interface SecurityDashboardProps {
  className?: string;
  onSecurityEvent?: (event: any) => void;
}

type DashboardView = 'overview' | 'threats' | 'compliance' | 'secrets' | 'audit' | 'settings';
type TimeRange = '1h' | '24h' | '7d' | '30d' | '90d';

export default function SecurityDashboard({ 
  className = '', 
  onSecurityEvent 
}: SecurityDashboardProps) {
  const [currentView, setCurrentView] = useState<DashboardView>('overview');
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  
  // Security data
  const [securityMetrics, setSecurityMetrics] = useState<any>({});
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<any[]>([]);
  const [complianceStatus, setComplianceStatus] = useState<any>({});
  const [secretsReport, setSecretsReport] = useState<any>({});
  const [vulnerabilities, setVulnerabilities] = useState<any[]>([]);
  
  // UI state
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  // Initialize security managers
  const securityManager = useMemo(() => getSecurityManager(), []);
  const gdprCompliance = useMemo(() => getGDPRCompliance(), []);
  const secureEnv = useMemo(() => getSecureEnv(), []);

  // Load security data
  const loadSecurityData = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Load security metrics
      const metrics = securityManager.getSecurityMetrics();
      setSecurityMetrics(metrics);
      
      // Load audit logs
      const logs = securityManager.getAuditLogs(100);
      setAuditLogs(logs);
      
      // Load security alerts
      const alerts = securityManager.getSecurityAlerts();
      setSecurityAlerts(alerts);
      
      // Load GDPR compliance status
      const compliance = gdprCompliance.getComplianceStatus();
      setComplianceStatus(compliance);
      
      // Load secrets report
      const secrets = secureEnv.getSecurityReport();
      setSecretsReport(secrets);
      
      // Load vulnerabilities
      const vulns = await securityManager.scanForVulnerabilities();
      setVulnerabilities(vulns);
      
      setLastUpdate(Date.now());
    } catch (error) {
      console.error('Failed to load security data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [securityManager, gdprCompliance, secureEnv]);

  // Auto-refresh data
  useEffect(() => {
    loadSecurityData();
    
    const interval = setInterval(loadSecurityData, 60000); // Every minute
    return () => clearInterval(interval);
  }, [loadSecurityData]);

  // Filter audit logs
  const filteredLogs = useMemo(() => {
    let filtered = auditLogs;
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(log => 
        log.event.toLowerCase().includes(query) ||
        log.details?.toString().toLowerCase().includes(query) ||
        log.userId?.toLowerCase().includes(query)
      );
    }
    
    // Filter by severity
    if (filterSeverity !== 'all') {
      filtered = filtered.filter(log => log.severity === filterSeverity);
    }
    
    // Filter by time range
    const now = Date.now();
    const timeRangeMs = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
    }[timeRange];
    
    filtered = filtered.filter(log => now - log.timestamp < timeRangeMs);
    
    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }, [auditLogs, searchQuery, filterSeverity, timeRange]);

  // Calculate security score
  const securityScore = useMemo(() => {
    let score = 100;
    
    // Deduct for critical alerts
    score -= securityAlerts.filter(a => a.severity === 'critical').length * 20;
    
    // Deduct for high severity alerts
    score -= securityAlerts.filter(a => a.severity === 'high').length * 10;
    
    // Deduct for vulnerabilities
    score -= vulnerabilities.filter(v => v.severity === 'critical').length * 15;
    score -= vulnerabilities.filter(v => v.severity === 'high').length * 8;
    
    // Deduct for weak secrets
    score -= secretsReport.weakSecrets * 5;
    
    // Deduct for missing required secrets
    score -= secretsReport.missingRequired * 10;
    
    // Deduct for compliance issues
    if (complianceStatus.metrics?.complianceScore) {
      score *= complianceStatus.metrics.complianceScore;
    }
    
    return Math.max(0, Math.min(100, score));
  }, [securityAlerts, vulnerabilities, secretsReport, complianceStatus]);

  // Render security score
  const renderSecurityScore = () => {
    const getScoreColor = (score: number) => {
      if (score >= 90) return 'text-green-400';
      if (score >= 70) return 'text-yellow-400';
      if (score >= 50) return 'text-orange-400';
      return 'text-red-400';
    };

    const getScoreIcon = (score: number) => {
      if (score >= 90) return <Shield className="text-green-400" size={24} />;
      if (score >= 70) return <AlertTriangle className="text-yellow-400" size={24} />;
      return <XCircle className="text-red-400" size={24} />;
    };

    return (
      <div className="bg-white/5 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-medium">Security Score</h3>
          <button
            onClick={loadSecurityData}
            className="p-2 rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
        
        <div className="flex items-center gap-4">
          {getScoreIcon(securityScore)}
          <div>
            <div className={`text-3xl font-bold ${getScoreColor(securityScore)}`}>
              {securityScore.toFixed(0)}
            </div>
            <div className="text-white/60 text-sm">out of 100</div>
          </div>
        </div>
        
        <div className="mt-4 w-full bg-white/10 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
              securityScore >= 90 ? 'bg-green-400' :
              securityScore >= 70 ? 'bg-yellow-400' :
              securityScore >= 50 ? 'bg-orange-400' :
              'bg-red-400'
            }`}
            style={{ width: `${securityScore}%` }}
          />
        </div>
        
        <div className="mt-2 text-xs text-white/60">
          Last updated: {new Date(lastUpdate).toLocaleTimeString()}
        </div>
      </div>
    );
  };

  // Render overview
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Security Score */}
      {renderSecurityScore()}
      
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-red-400" />
            <span className="text-white/80 text-sm">Critical Alerts</span>
          </div>
          <div className="text-white text-2xl font-bold">
            {securityAlerts.filter(a => a.severity === 'critical').length}
          </div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={16} className="text-blue-400" />
            <span className="text-white/80 text-sm">Events (24h)</span>
          </div>
          <div className="text-white text-2xl font-bold">
            {securityMetrics.eventsLast24h || 0}
          </div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Key size={16} className="text-green-400" />
            <span className="text-white/80 text-sm">Secrets</span>
          </div>
          <div className="text-white text-2xl font-bold">
            {secretsReport.loadedSecrets || 0}
          </div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={16} className="text-purple-400" />
            <span className="text-white/80 text-sm">Compliance</span>
          </div>
          <div className="text-white text-2xl font-bold">
            {((complianceStatus.metrics?.complianceScore || 0) * 100).toFixed(0)}%
          </div>
        </div>
      </div>
      
      {/* Recent Alerts */}
      <div className="bg-white/5 rounded-lg p-4">
        <h3 className="text-white font-medium mb-4">Recent Security Alerts</h3>
        
        {securityAlerts.length === 0 ? (
          <div className="text-center py-8 text-white/60">
            <CheckCircle size={48} className="mx-auto mb-4 opacity-50" />
            <p>No security alerts</p>
          </div>
        ) : (
          <div className="space-y-3">
            {securityAlerts.slice(0, 5).map(alert => (
              <div
                key={alert.id}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                  alert.severity === 'critical' ? 'bg-red-600/20 hover:bg-red-600/30' :
                  alert.severity === 'high' ? 'bg-orange-600/20 hover:bg-orange-600/30' :
                  alert.severity === 'medium' ? 'bg-yellow-600/20 hover:bg-yellow-600/30' :
                  'bg-blue-600/20 hover:bg-blue-600/30'
                }`}
                onClick={() => setSelectedAlert(alert.id)}
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle size={16} className={
                    alert.severity === 'critical' ? 'text-red-400' :
                    alert.severity === 'high' ? 'text-orange-400' :
                    alert.severity === 'medium' ? 'text-yellow-400' :
                    'text-blue-400'
                  } />
                  <div>
                    <div className="text-white font-medium">{alert.event}</div>
                    <div className="text-white/60 text-sm">
                      {new Date(alert.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    alert.severity === 'critical' ? 'bg-red-600 text-white' :
                    alert.severity === 'high' ? 'bg-orange-600 text-white' :
                    alert.severity === 'medium' ? 'bg-yellow-600 text-white' :
                    'bg-blue-600 text-white'
                  }`}>
                    {alert.severity}
                  </span>
                  
                  {!alert.resolved && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Mark as resolved
                      }}
                      className="p-1 rounded text-white/60 hover:text-white transition-colors"
                    >
                      <Check size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Vulnerabilities */}
      {vulnerabilities.length > 0 && (
        <div className="bg-white/5 rounded-lg p-4">
          <h3 className="text-white font-medium mb-4">Security Vulnerabilities</h3>
          
          <div className="space-y-3">
            {vulnerabilities.slice(0, 3).map((vuln, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                <div>
                  <div className="text-white font-medium">{vuln.type}</div>
                  <div className="text-white/60 text-sm">{vuln.recommendation}</div>
                </div>
                
                <span className={`px-2 py-1 rounded text-xs ${
                  vuln.severity === 'critical' ? 'bg-red-600 text-white' :
                  vuln.severity === 'high' ? 'bg-orange-600 text-white' :
                  vuln.severity === 'medium' ? 'bg-yellow-600 text-white' :
                  'bg-blue-600 text-white'
                }`}>
                  {vuln.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Render audit logs
  const renderAuditLogs = () => (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-blue-400"
          />
        </div>
        
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-400"
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as TimeRange)}
          className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-400"
        >
          <option value="1h">Last Hour</option>
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
        </select>
      </div>
      
      {/* Logs table */}
      <div className="bg-white/5 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/10">
              <tr>
                <th className="text-left p-3 text-white/80 text-sm">Timestamp</th>
                <th className="text-left p-3 text-white/80 text-sm">Event</th>
                <th className="text-left p-3 text-white/80 text-sm">Severity</th>
                <th className="text-left p-3 text-white/80 text-sm">User</th>
                <th className="text-left p-3 text-white/80 text-sm">Details</th>
                <th className="text-left p-3 text-white/80 text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => (
                <tr key={log.id} className="border-t border-white/10 hover:bg-white/5">
                  <td className="p-3 text-white/80 text-sm">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="p-3 text-white font-medium">{log.event}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      log.severity === 'critical' ? 'bg-red-600 text-white' :
                      log.severity === 'high' ? 'bg-orange-600 text-white' :
                      log.severity === 'medium' ? 'bg-yellow-600 text-white' :
                      'bg-blue-600 text-white'
                    }`}>
                      {log.severity}
                    </span>
                  </td>
                  <td className="p-3 text-white/80 text-sm">{log.userId || 'System'}</td>
                  <td className="p-3 text-white/60 text-sm max-w-xs truncate">
                    {JSON.stringify(log.details)}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => {
                        // Show log details
                      }}
                      className="p-1 rounded text-white/60 hover:text-white transition-colors"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredLogs.length === 0 && (
          <div className="text-center py-8 text-white/60">
            <FileText size={48} className="mx-auto mb-4 opacity-50" />
            <p>No audit logs found</p>
          </div>
        )}
      </div>
    </div>
  );

  // Render secrets management
  const renderSecrets = () => (
    <div className="space-y-6">
      {/* Secrets overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Key size={16} className="text-green-400" />
            <span className="text-white/80 text-sm">Total Secrets</span>
          </div>
          <div className="text-white text-2xl font-bold">
            {secretsReport.totalSecrets || 0}
          </div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={16} className="text-blue-400" />
            <span className="text-white/80 text-sm">Loaded</span>
          </div>
          <div className="text-white text-2xl font-bold">
            {secretsReport.loadedSecrets || 0}
          </div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lock size={16} className="text-purple-400" />
            <span className="text-white/80 text-sm">Encrypted</span>
          </div>
          <div className="text-white text-2xl font-bold">
            {secretsReport.encryptedSecrets || 0}
          </div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-red-400" />
            <span className="text-white/80 text-sm">Issues</span>
          </div>
          <div className="text-white text-2xl font-bold">
            {(secretsReport.weakSecrets || 0) + (secretsReport.missingRequired || 0)}
          </div>
        </div>
      </div>
      
      {/* Secrets breakdown */}
      <div className="bg-white/5 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-medium">Secrets Breakdown</h3>
          <button
            onClick={() => setShowSensitiveData(!showSensitiveData)}
            className="flex items-center gap-2 px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-white text-sm transition-colors"
          >
            {showSensitiveData ? <EyeOff size={14} /> : <Eye size={14} />}
            {showSensitiveData ? 'Hide' : 'Show'} Values
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-white/80 text-sm mb-2">By Type</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white/60">Required</span>
                <span className="text-white">{secretsReport.secretsByType?.required || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">Optional</span>
                <span className="text-white">{secretsReport.secretsByType?.optional || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">Sensitive</span>
                <span className="text-white">{secretsReport.secretsByType?.sensitive || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">Public</span>
                <span className="text-white">{secretsReport.secretsByType?.public || 0}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-white/80 text-sm mb-2">Issues</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white/60">Weak Secrets</span>
                <span className="text-red-400">{secretsReport.weakSecrets || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">Missing Required</span>
                <span className="text-red-400">{secretsReport.missingRequired || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">Validation Errors</span>
                <span className="text-orange-400">{secretsReport.validationErrors || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Secret rotation recommendations */}
      <div className="bg-white/5 rounded-lg p-4">
        <h3 className="text-white font-medium mb-4">Rotation Recommendations</h3>
        
        <div className="space-y-3">
          {vulnerabilities
            .filter(v => v.type === 'expired_secret')
            .map((vuln, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-yellow-600/20 rounded-lg">
                <div>
                  <div className="text-white font-medium">Secret Rotation Required</div>
                  <div className="text-white/60 text-sm">
                    Secret {vuln.secretId} is {vuln.age} days old
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    // Rotate secret
                  }}
                  className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-white text-sm transition-colors"
                >
                  Rotate Now
                </button>
              </div>
            ))}
          
          {vulnerabilities.filter(v => v.type === 'expired_secret').length === 0 && (
            <div className="text-center py-4 text-white/60">
              <CheckCircle size={24} className="mx-auto mb-2 opacity-50" />
              <p>All secrets are up to date</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render GDPR compliance
  const renderCompliance = () => (
    <div className="space-y-6">
      {/* Compliance overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-blue-400" />
            <span className="text-white/80 text-sm">Data Subjects</span>
          </div>
          <div className="text-white text-2xl font-bold">
            {complianceStatus.metrics?.totalDataSubjects || 0}
          </div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={16} className="text-green-400" />
            <span className="text-white/80 text-sm">Active Consents</span>
          </div>
          <div className="text-white text-2xl font-bold">
            {complianceStatus.metrics?.activeConsents || 0}
          </div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-yellow-400" />
            <span className="text-white/80 text-sm">Pending Requests</span>
          </div>
          <div className="text-white text-2xl font-bold">
            {complianceStatus.metrics?.pendingRequests || 0}
          </div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Trash2 size={16} className="text-red-400" />
            <span className="text-white/80 text-sm">Scheduled Deletions</span>
          </div>
          <div className="text-white text-2xl font-bold">
            {complianceStatus.scheduledDeletions?.length || 0}
          </div>
        </div>
      </div>
      
      {/* Compliance score */}
      <div className="bg-white/5 rounded-lg p-4">
        <h3 className="text-white font-medium mb-4">GDPR Compliance Score</h3>
        
        <div className="flex items-center gap-4 mb-4">
          <div className="text-3xl font-bold text-green-400">
            {((complianceStatus.metrics?.complianceScore || 0) * 100).toFixed(0)}%
          </div>
          <div className="flex-1">
            <div className="w-full bg-white/10 rounded-full h-3">
              <div 
                className="bg-green-400 h-3 rounded-full transition-all duration-500"
                style={{ width: `${(complianceStatus.metrics?.complianceScore || 0) * 100}%` }}
              />
            </div>
          </div>
        </div>
        
        <div className="text-white/60 text-sm">
          Compliance score based on consent management, data requests processing, and retention policies
        </div>
      </div>
      
      {/* Pending requests */}
      {complianceStatus.pendingRequests?.length > 0 && (
        <div className="bg-white/5 rounded-lg p-4">
          <h3 className="text-white font-medium mb-4">Pending Data Requests</h3>
          
          <div className="space-y-3">
            {complianceStatus.pendingRequests.map((request: any) => (
              <div key={request.id} className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                <div>
                  <div className="text-white font-medium">{request.type.toUpperCase()} Request</div>
                  <div className="text-white/60 text-sm">
                    Requested {new Date(request.requestedAt).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    request.status === 'pending' ? 'bg-yellow-600 text-white' :
                    request.status === 'processing' ? 'bg-blue-600 text-white' :
                    'bg-green-600 text-white'
                  }`}>
                    {request.status}
                  </span>
                  
                  <button
                    onClick={() => {
                      // Process request
                    }}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm transition-colors"
                  >
                    Process
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Scheduled deletions */}
      {complianceStatus.scheduledDeletions?.length > 0 && (
        <div className="bg-white/5 rounded-lg p-4">
          <h3 className="text-white font-medium mb-4">Scheduled Data Deletions</h3>
          
          <div className="space-y-3">
            {complianceStatus.scheduledDeletions.map((deletion: any) => (
              <div key={deletion.userId} className="flex items-center justify-between p-3 bg-red-600/20 rounded-lg">
                <div>
                  <div className="text-white font-medium">User Data Deletion</div>
                  <div className="text-white/60 text-sm">
                    Scheduled for {new Date(deletion.scheduledFor).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-red-600 rounded text-xs text-white">
                    {Math.ceil((deletion.scheduledFor - Date.now()) / (24 * 60 * 60 * 1000))} days
                  </span>
                  
                  <button
                    onClick={() => {
                      // Cancel deletion
                    }}
                    className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-white text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className={`bg-black/90 backdrop-blur-md border border-white/10 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Shield size={24} className="text-green-400" />
            Security Dashboard
          </h1>
          
          <div className="flex items-center gap-3">
            <div className="text-sm text-white/60">
              Last updated: {new Date(lastUpdate).toLocaleTimeString()}
            </div>
            
            <button
              onClick={loadSecurityData}
              className="p-2 rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
              disabled={isLoading}
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
          {[
            { id: 'overview', name: 'Overview', icon: BarChart3 },
            { id: 'threats', name: 'Threats', icon: AlertTriangle },
            { id: 'compliance', name: 'GDPR', icon: CheckCircle },
            { id: 'secrets', name: 'Secrets', icon: Key },
            { id: 'audit', name: 'Audit Logs', icon: FileText },
            { id: 'settings', name: 'Settings', icon: Settings },
          ].map(({ id, name, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setCurrentView(id as DashboardView)}
              className={`flex items-center gap-2 px-4 py-2 rounded text-sm transition-colors ${
                currentView === id ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white'
              }`}
            >
              <Icon size={16} />
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw size={32} className="animate-spin text-white/60" />
          </div>
        ) : (
          <>
            {currentView === 'overview' && renderOverview()}
            {currentView === 'threats' && renderOverview()} {/* Reuse overview for now */}
            {currentView === 'compliance' && renderCompliance()}
            {currentView === 'secrets' && renderSecrets()}
            {currentView === 'audit' && renderAuditLogs()}
            {currentView === 'settings' && (
              <div className="text-center py-12 text-white/60">
                <Settings size={48} className="mx-auto mb-4 opacity-50" />
                <p>Security settings panel coming soon</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
