import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Eye, CheckCircle, XCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AnalyticsData {
  trigger_type: string;
  impressions: number;
  completions: number;
  skips: number;
  completion_rate: number;
}

const TRIGGER_LABELS: Record<string, string> = {
  page_open: 'Page Open',
  auth_event: 'Login/Logout',
  favorite_add: 'Add Favorites',
  refresh: 'Page Refresh',
  promo_copy: 'Copy Promo',
  shop_open: 'Open Shop',
  click: 'Click Events',
  load_screen: 'Load Screen',
  manual: 'Manual',
};

export function AdAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [totals, setTotals] = useState({ impressions: 0, completions: 0, skips: 0 });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const now = new Date();
      let startDate: Date;
      
      switch (timeRange) {
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0);
      }

      const { data, error } = await supabase
        .from('ad_analytics')
        .select('trigger_type, event_type')
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      // Process data
      const byTrigger: Record<string, { impressions: number; completions: number; skips: number }> = {};
      let totalImpressions = 0;
      let totalCompletions = 0;
      let totalSkips = 0;

      data?.forEach((row) => {
        if (!byTrigger[row.trigger_type]) {
          byTrigger[row.trigger_type] = { impressions: 0, completions: 0, skips: 0 };
        }
        
        if (row.event_type === 'impression') {
          byTrigger[row.trigger_type].impressions++;
          totalImpressions++;
        } else if (row.event_type === 'completion') {
          byTrigger[row.trigger_type].completions++;
          totalCompletions++;
        } else if (row.event_type === 'skip') {
          byTrigger[row.trigger_type].skips++;
          totalSkips++;
        }
      });

      const analyticsData: AnalyticsData[] = Object.entries(byTrigger).map(([trigger, stats]) => ({
        trigger_type: trigger,
        impressions: stats.impressions,
        completions: stats.completions,
        skips: stats.skips,
        completion_rate: stats.impressions > 0 ? (stats.completions / stats.impressions) * 100 : 0,
      })).sort((a, b) => b.impressions - a.impressions);

      setAnalytics(analyticsData);
      setTotals({ impressions: totalImpressions, completions: totalCompletions, skips: totalSkips });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const overallCompletionRate = totals.impressions > 0 
    ? ((totals.completions / totals.impressions) * 100).toFixed(1) 
    : '0';

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Ad Analytics
        </CardTitle>
        <CardDescription>
          Track ad impressions and completion rates
        </CardDescription>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40 mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24h</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <Eye className="h-5 w-5 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold">{totals.impressions}</p>
            <p className="text-sm text-muted-foreground">Impressions</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <CheckCircle className="h-5 w-5 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">{totals.completions}</p>
            <p className="text-sm text-muted-foreground">Completions</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <XCircle className="h-5 w-5 mx-auto mb-2 text-red-500" />
            <p className="text-2xl font-bold">{totals.skips}</p>
            <p className="text-sm text-muted-foreground">Skips</p>
          </div>
        </div>

        <div className="text-center py-2 bg-primary/10 rounded-lg">
          <p className="text-lg font-semibold">{overallCompletionRate}% Completion Rate</p>
        </div>

        {/* By trigger breakdown */}
        {analytics.length > 0 ? (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">By Trigger Type</h4>
            <div className="space-y-2">
              {analytics.map((item) => (
                <div key={item.trigger_type} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{TRIGGER_LABELS[item.trigger_type] || item.trigger_type}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.impressions} views · {item.completions} completed · {item.skips} skipped
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{item.completion_rate.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">completion</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-4">No analytics data yet</p>
        )}
      </CardContent>
    </Card>
  );
}