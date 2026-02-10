import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Search, RefreshCw, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { AuditLog } from '../../shared/types/entities';

const ENTITY_TYPES = ['All', 'Sale', 'Invoice', 'Customer', 'Product', 'Truck', 'User'];

const ACTION_COLORS: Record<string, string> = {
    CREATE: 'bg-green-100 text-green-800',
    UPDATE: 'bg-blue-100 text-blue-800',
    DELETE: 'bg-red-100 text-red-800',
    ISSUE: 'bg-purple-100 text-purple-800',
    MARK_PAID: 'bg-emerald-100 text-emerald-800',
    PARTIAL_PAYMENT: 'bg-yellow-100 text-yellow-800',
    CANCEL: 'bg-orange-100 text-orange-800',
    MERGE: 'bg-indigo-100 text-indigo-800',
    ASSIGN_CUSTOMER: 'bg-cyan-100 text-cyan-800',
    LOGIN: 'bg-gray-100 text-gray-800',
};

const PAGE_SIZE = 50;

export function AuditLogs() {
    const { t } = useTranslation();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('All');
    const [searchId, setSearchId] = useState('');
    const [page, setPage] = useState(0);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const params: any = { limit: PAGE_SIZE, offset: page * PAGE_SIZE };
            if (filter !== 'All') params.entityType = filter;
            if (searchId.trim()) params.entityId = searchId.trim();
            const data = await window.api.audit.getLogs(params);
            setLogs(data);
        } catch (error) {
            console.error('Failed to load audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLogs();
    }, [filter, page]);

    const handleSearch = () => {
        setPage(0);
        loadLogs();
    };

    const formatDate = (dateStr: string) => {
        try {
            const d = new Date(dateStr);
            return d.toLocaleString();
        } catch {
            return dateStr;
        }
    };

    const formatDetails = (details: string | null) => {
        if (!details) return '-';
        try {
            const parsed = JSON.parse(details);
            return Object.entries(parsed)
                .map(([k, v]) => `${k}: ${v}`)
                .join(', ');
        } catch {
            return details;
        }
    };

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Shield className="text-primary-600" size={24} />
                    <h1 className="text-2xl font-bold text-gray-800">{t('audit.title')}</h1>
                </div>
                <button
                    onClick={loadLogs}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    {t('common.refresh')}
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-600">{t('audit.entityType')}:</label>
                    <select
                        value={filter}
                        onChange={(e) => { setFilter(e.target.value); setPage(0); }}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                    >
                        {ENTITY_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-600">{t('audit.entityId')}:</label>
                    <input
                        type="text"
                        value={searchId}
                        onChange={(e) => setSearchId(e.target.value)}
                        placeholder={t('audit.searchPlaceholder')}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm w-64"
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button
                        onClick={handleSearch}
                        className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                        <Search size={16} />
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('audit.date')}</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('audit.entityType')}</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('audit.action')}</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('audit.entityId')}</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('audit.details')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={5} className="text-center py-12 text-gray-400">
                                        <FileText size={40} className="mx-auto mb-3 opacity-50" />
                                        <p>{t('common.noData')}</p>
                                    </td>
                                </tr>
                            )}
                            {loading && (
                                <tr>
                                    <td colSpan={5} className="text-center py-12 text-gray-400">
                                        <RefreshCw size={24} className="mx-auto mb-2 animate-spin" />
                                        <p>{t('common.loading')}</p>
                                    </td>
                                </tr>
                            )}
                            {logs.map((log) => (
                                <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                                        {formatDate(log.createdAt)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                                            {log.entityType}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-700'}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500 font-mono" title={log.entityId}>
                                        {log.entityId.length > 12 ? `${log.entityId.substring(0, 12)}...` : log.entityId}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600 max-w-md truncate" title={formatDetails(log.details)}>
                                        {formatDetails(log.details)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
                    <div className="text-sm text-gray-500">
                        {t('audit.page')} {page + 1} · {logs.length} {t('audit.records')}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            onClick={() => setPage(p => p + 1)}
                            disabled={logs.length < PAGE_SIZE}
                            className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
