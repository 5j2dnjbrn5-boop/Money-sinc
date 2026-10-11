import React, { useState } from 'react';
import {
  Settings,
  Download,
  Upload,
  FileSpreadsheet,
  Repeat,
  Tag,
  ShieldCheck,
  Share2,
  Trash2,
  Plus,
  Play,
  Check,
  Copy,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import {
  MoneySyncDataV2,
  RecurringRule,
  Transaction,
  Wallet,
} from '../types';
import {
  exportDataAsJSON,
  exportDataAsCSV,
  validateImportData,
} from '../services/storage';
import { formatMoney } from '../constants';

interface SettingsViewProps {
  data: MoneySyncDataV2;
  onImportData: (importedData: MoneySyncDataV2, isMerge: boolean) => void;
  onSaveRecurringRule: (rule: RecurringRule) => void;
  onDeleteRecurringRule: (ruleId: string) => void;
  onProcessRecurringNow: () => void;
  onAddCategory: (type: 'expense' | 'income', newCategory: string) => void;
  onResetToEmpty: () => void;
  onShowToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  data,
  onImportData,
  onSaveRecurringRule,
  onDeleteRecurringRule,
  onProcessRecurringNow,
  onAddCategory,
  onResetToEmpty,
  onShowToast,
}) => {
  // Recurring Modal
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [recTitle, setRecTitle] = useState('');
  const [recType, setRecType] = useState<'income' | 'expense'>('expense');
  const [recAmount, setRecAmount] = useState('');
  const [recCategory, setRecCategory] = useState(data.customCategories.expense[0] || '🍚 อาหาร');
  const [recWalletId, setRecWalletId] = useState(data.wallets[0]?.id || 'cash');
  const [recDay, setRecDay] = useState('1');

  // New Category
  const [newExpenseCat, setNewExpenseCat] = useState('');
  const [newIncomeCat, setNewIncomeCat] = useState('');

  // Share Snapshot state
  const [shareRange, setShareRange] = useState<'month' | 'all'>('month');
  const [includeNotes, setIncludeNotes] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  // Handle Export
  const handleExportJSON = () => {
    try {
      exportDataAsJSON(data);
      onShowToast('ดาวน์โหลดไฟล์สำรองข้อมูล JSON เรียบร้อยแล้ว ✓', 'success');
    } catch {
      onShowToast('เกิดข้อผิดพลาดในการดาวน์โหลด', 'error');
    }
  };

  const handleExportCSV = () => {
    try {
      exportDataAsCSV(data.transactions);
      onShowToast('ส่งออกไฟล์ CSV สำหรับ Excel เรียบร้อยแล้ว ✓', 'success');
    } catch {
      onShowToast('เกิดข้อผิดพลาดในการส่งออก CSV', 'error');
    }
  };

  // Handle Import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const validated = validateImportData(parsed);

        if (!validated) {
          onShowToast('รูปแบบไฟล์ไม่ถูกต้อง โปรดใช้ไฟล์ JSON ของ MoneySync', 'error');
          return;
        }

        const confirmMerge = window.confirm(
          `พบข้อมูลธุรกรรมจำนวน ${validated.transactions.length} รายการ\nกด "ตกลง (OK)" เพื่อรวมข้อมูลเข้ากับของเดิม\nหรือกด "ยกเลิก (Cancel)" เพื่อแทนที่ข้อมูลทั้งหมด`
        );

        onImportData(validated, confirmMerge);
        onShowToast('นำเข้าข้อมูลเรียบร้อยแล้ว ✓', 'success');
      } catch (err) {
        onShowToast('ไม่สามารถอ่านไฟล์ JSON ได้', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Create Recurring
  const handleRecurringSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(recAmount);
    if (isNaN(amt) || amt <= 0) return;

    const rule: RecurringRule = {
      id: crypto.randomUUID(),
      title: recTitle.trim(),
      type: recType,
      amount: amt,
      category: recCategory,
      walletId: recWalletId,
      frequency: 'monthly',
      dayOfMonth: parseInt(recDay, 10) || 1,
      active: true,
    };

    onSaveRecurringRule(rule);
    setIsRecurringModalOpen(false);
    setRecTitle('');
    setRecAmount('');
    onShowToast('บันทึกรายการประจำเรียบร้อย ✓', 'success');
  };

  // Build Snapshot Share URL
  const generateShareSnapshot = () => {
    const curMonthKey = new Date().toISOString().slice(0, 7);
    const filteredTxs = shareRange === 'month'
      ? data.transactions.filter(t => t.date.slice(0, 7) === curMonthKey)
      : data.transactions;

    const payload = {
      v: 1,
      createdAt: new Date().toISOString(),
      range: shareRange,
      notes: includeNotes,
      transactions: filteredTxs.map(t => ({
        ...t,
        note: includeNotes ? t.note : '',
      })),
    };

    const bytes = new TextEncoder().encode(JSON.stringify(payload));
    let bin = '';
    bytes.forEach(b => (bin += String.fromCharCode(b)));
    const b64 = btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const url = `${window.location.origin}${window.location.pathname}#snapshot=${b64}`;
    setShareUrl(url);
    onShowToast('สร้างลิงก์ Snapshot เรียบร้อยแล้ว ✓', 'success');
  };

  const copyShareUrl = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      onShowToast('คัดลอกลิงก์เรียบร้อยแล้ว ✓', 'success');
    } catch {
      onShowToast('ไม่สามารถคัดลอกได้อัตโนมัติ', 'error');
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          การจัดการระบบ & ความปลอดภัยข้อมูล
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <span>⚙️ ตั้งค่า & สำรองข้อมูล</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          ระบบเก็บข้อมูลในเบราว์เซอร์ของคุณ 100% (Local-first) สามารถสำรองและนำเข้าข้อมูลได้ตลอดเวลา
        </p>
      </div>

      {/* 1. Recurring Transactions (Requirement 10) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Repeat className="w-4 h-4 text-indigo-500" />
              <span>รายการประจำ (Recurring Transactions)</span>
            </h2>
            <p className="text-xs text-slate-500">
              เช่น ค่าเช่าห้อง, เงินเดือน, ค่าไฟ, Subscription Netflix ที่ต้องลงบัญชีทุกเดือน
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onProcessRecurringNow}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              title="ตรวจหาและบันทึกรายการประจำของเดือนนี้ที่ยังไม่ได้ลงบัญชี"
            >
              <Play className="w-3.5 h-3.5 text-emerald-500" />
              <span>ประมวลผลทันที</span>
            </button>
            <button
              onClick={() => setIsRecurringModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มรายการประจำ</span>
            </button>
          </div>
        </div>

        {data.recurring.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.recurring.map(rule => (
              <div key={rule.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    {rule.title}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    ทุกวันที่ {rule.dayOfMonth} ของเดือน · {rule.category}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`font-mono-num font-bold ${
                      rule.type === 'income' ? 'text-emerald-500' : 'text-rose-500'
                    }`}
                  >
                    {rule.type === 'income' ? '+' : '−'}
                    {formatMoney(rule.amount)}
                  </span>
                  <button
                    onClick={() => onDeleteRecurringRule(rule.id)}
                    className="p-1 text-slate-400 hover:text-rose-600"
                    title="ลบรายการประจำ"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-400">
            ยังไม่มีรายการประจำที่ตั้งค่าไว้
          </div>
        )}
      </div>

      {/* 2. Backup & Export / Import (Requirement 18 & 19) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Download className="w-4 h-4 text-indigo-500" />
            <span>สำรองและนำเข้าข้อมูล (Backup & Restore)</span>
          </h2>
          <p className="text-xs text-slate-500">
            เพื่อความปลอดภัยสำหรับใช้งานต่อเนื่องหลายปี แนะนำให้ดาวน์โหลดไฟล์สำรองเก็บไว้เป็นระยะ
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* JSON Export */}
          <button
            onClick={handleExportJSON}
            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 hover:border-indigo-400 text-left transition-all group"
          >
            <Download className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mb-2" />
            <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600">
              สำรองข้อมูล (JSON)
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              โครงสร้างครบทั้งธุรกรรม งบประมาณ และเป้าหมาย
            </p>
          </button>

          {/* CSV Export */}
          <button
            onClick={handleExportCSV}
            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 hover:border-indigo-400 text-left transition-all group"
          >
            <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mb-2" />
            <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600">
              ส่งออก Excel (CSV)
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              รองรับภาษาไทย UTF-8 เปิดใน Excel / Sheets ได้ทันที
            </p>
          </button>

          {/* Import JSON */}
          <label className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 hover:border-indigo-400 text-left transition-all group cursor-pointer block">
            <Upload className="w-5 h-5 text-amber-500 mb-2" />
            <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-500">
              นำเข้าข้อมูล (Import)
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              กู้คืนจากไฟล์ JSON พร้อมระบบตรวจความถูกต้อง
            </p>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* 3. Share Snapshot (Requirement 1 & 20) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Share2 className="w-4 h-4 text-indigo-500" />
            <span>สร้างภาพถ่ายแชร์ข้อมูล (Share Snapshot)</span>
          </h2>
          <p className="text-xs text-slate-500">
            สร้างลิงก์สำหรับดูอย่างเดียวแบบ Read-Only โดยข้อมูลจะถูกเข้ารหัสใน URL ไม่ส่งไปยัง Server
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              ช่วงข้อมูลที่ต้องการแชร์
            </label>
            <select
              value={shareRange}
              onChange={(e) => setShareRange(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            >
              <option value="month">เฉพาะเดือนปัจจุบัน</option>
              <option value="all">ข้อมูลทั้งหมด</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              รวมโน้ตส่วนตัวด้วยหรือไม่
            </label>
            <select
              value={includeNotes ? 'yes' : 'no'}
              onChange={(e) => setIncludeNotes(e.target.value === 'yes')}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            >
              <option value="no">ไม่แชร์โน้ต (ซ่อนรายละเอียด)</option>
              <option value="yes">แชร์โน้ตด้วย</option>
            </select>
          </div>
        </div>

        <button
          onClick={generateShareSnapshot}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 rounded-xl transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>สร้างลิงก์ Snapshot</span>
        </button>

        {shareUrl && (
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
              ลิงก์ Snapshot พร้อมใช้งาน (ใครที่มีลิงก์จะสามารถดูข้อมูลชุดนี้ได้):
            </div>
            <textarea
              readOnly
              value={shareUrl}
              className="w-full text-xs font-mono p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 h-16"
            />
            <div className="flex gap-2">
              <button
                onClick={copyShareUrl}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>คัดลอกลิงก์</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Privacy & Data Integrity Info (Requirement 19 & 20) */}
      <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-3">
        <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
          <ShieldCheck className="w-5 h-5" />
          <span>นโยบายความเป็นส่วนตัวและความปลอดภัย (Privacy Guarantee)</span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          MoneySync ออกแบบด้วยสถาปัตยกรรม <strong>Local-First OS</strong> ข้อมูลทางการเงินของคุณถูกบันทึกไว้ในหน่วยความจำของอุปกรณ์นี้เท่านั้น
          ไม่มีการส่งข้อมูลไปยัง Server ภายนอก ข้อมูลทุกปีและทุกเดือนของคุณจะคงอยู่เสมอแม้ปิดหน้าเว็บหรือเปิดใหม่ในอนาคต
        </p>
      </div>

      {/* 5. Danger Zone (Reset/Clear Demo Data) */}
      <div className="p-6 rounded-3xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 space-y-3">
        <h2 className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
          โซนจัดการข้อมูล (Data Control)
        </h2>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-rose-600/80 dark:text-rose-300/80">
            ล้างข้อมูลเพื่อเริ่มต้นบันทึกข้อมูลจริงของคุณใหม่ทั้งหมด (แนะนำให้สำรองข้อมูล JSON ไว้ก่อน)
          </p>
          <button
            onClick={onResetToEmpty}
            className="px-3.5 py-2 text-xs font-bold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-300 dark:border-rose-800 rounded-xl transition-colors shrink-0"
          >
            ล้างข้อมูลทั้งหมดเพื่อเริ่มใหม่
          </button>
        </div>
      </div>

      {/* Recurring Rule Modal */}
      {isRecurringModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              สร้างรายการประจำใหม่
            </h2>

            <form onSubmit={handleRecurringSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  ชื่อรายการ
                </label>
                <input
                  type="text"
                  required
                  value={recTitle}
                  onChange={(e) => setRecTitle(e.target.value)}
                  placeholder="เช่น Netflix, ค่าเช่าห้อง, ค่าอินเทอร์เน็ต"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    ประเภท
                  </label>
                  <select
                    value={recType}
                    onChange={(e) => setRecType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="expense">รายจ่าย</option>
                    <option value="income">รายรับ</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    จำนวนเงิน (฿)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={recAmount}
                    onChange={(e) => setRecAmount(e.target.value)}
                    placeholder="199"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono-num font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    หมวดหมู่
                  </label>
                  <select
                    value={recCategory}
                    onChange={(e) => setRecCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    {(recType === 'expense' ? data.customCategories.expense : data.customCategories.income).map(c => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    ทุกวันที่ของเดือน
                  </label>
                  <select
                    value={recDay}
                    onChange={(e) => setRecDay(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <option key={day} value={day}>
                        วันที่ {day}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsRecurringModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
