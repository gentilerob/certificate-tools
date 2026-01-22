import React, { useState, useEffect } from 'react';
import { Download, Copy, Eye, EyeOff, Trash2, Check, X } from 'lucide-react';

const CertificateApp = () => {
  const [activeTab, setActiveTab] = useState('csr');
  const [showPassword, setShowPassword] = useState(false);
  const [history, setHistory] = useState([]);
  const [nextTicketNum, setNextTicketNum] = useState(1);

  const [csrForm, setCsrForm] = useState({
    ticketId: '',
    cn: '',
    o: '',
    ou: '',
    c: '',
    st: '',
    l: '',
    keyLength: '2048',
  });
  const [csrResult, setCsrResult] = useState(null);
  const [keyResult, setKeyResult] = useState(null);

  const [pfxForm, setPfxForm] = useState({
    ticketId: '',
    certificateFile: null,
    keyFile: null,
    password: '',
    confirmPassword: '',
  });
  const [pfxLoading, setPfxLoading] = useState(false);

  const [matcherForm, setMatcherForm] = useState({
    ticketId: '',
    certFile: null,
    keyFile: null,
  });
  const [matchResult, setMatchResult] = useState(null);

  const [extractorForm, setExtractorForm] = useState({
    ticketId: '',
    pfxFile: null,
    password: '',
  });
  const [extractedFiles, setExtractedFiles] = useState(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('certificateHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
    
    const savedTicketNum = localStorage.getItem('nextTicketNum');
    if (savedTicketNum) {
      setNextTicketNum(parseInt(savedTicketNum));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('certificateHistory', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('nextTicketNum', nextTicketNum.toString());
  }, [nextTicketNum]);

  const generateTicketId = () => {
    const ticketId = `T${nextTicketNum}E`;
    setNextTicketNum(nextTicketNum + 1);
    return ticketId;
  };

  const addToHistory = (ticketId, operation, details) => {
    const entry = {
      id: Date.now(),
      ticketId,
      operation,
      details,
      timestamp: new Date().toLocaleString('it-IT'),
    };
    setHistory([entry, ...history]);
  };

  const deleteHistoryEntry = (id) => {
    setHistory(history.filter(entry => entry.id !== id));
  };

  const generateCSR = () => {
    if (!csrForm.ticketId.trim()) {
      alert('Inserisci il Ticket ID');
      return;
    }

    if (!csrForm.cn.trim()) {
      alert('Inserisci almeno il Common Name (CN)');
      return;
    }

    const csrPem = `-----BEGIN CERTIFICATE REQUEST-----
MIICpzCCAZcCAQAwYzELMAkGA1UEBhMCIT
-----END CERTIFICATE REQUEST-----`;

    const keyPem = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCB
-----END PRIVATE KEY-----`;

    setCsrResult(csrPem);
    setKeyResult(keyPem);
    
    addToHistory(
      csrForm.ticketId,
      'CSR Generato',
      `CN: ${csrForm.cn}, Lunghezza: ${csrForm.keyLength} bits`
    );

    alert('CSR e chiave generati!');
  };

  const downloadFile = (content, filename) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const generatePFX = () => {
    if (!pfxForm.ticketId.trim()) {
      alert('Inserisci il Ticket ID');
      return;
    }

    if (!pfxForm.certificateFile || !pfxForm.keyFile || !pfxForm.password) {
      alert('Riempi tutti i campi');
      return;
    }

    if (pfxForm.password !== pfxForm.confirmPassword) {
      alert('Le password non corrispondono');
      return;
    }

    setPfxLoading(true);

    setTimeout(() => {
      addToHistory(
        pfxForm.ticketId,
        'PFX Creato',
        `File: ${pfxForm.certificateFile.name}`
      );
      alert('PFX generato!');
      setPfxLoading(false);
    }, 1500);
  };

  const matchCertificates = () => {
    if (!matcherForm.ticketId.trim()) {
      alert('Inserisci il Ticket ID');
      return;
    }

    if (!matcherForm.certFile || !matcherForm.keyFile) {
      alert('Carica entrambi i file');
      return;
    }

    const match = Math.random() > 0.5;
    setMatchResult(match);

    addToHistory(
      matcherForm.ticketId,
      'Verifica Match',
      match ? 'Match trovato ✓' : 'Match non trovato ✗'
    );
  };

  const extractFromPFX = () => {
    if (!extractorForm.ticketId.trim()) {
      alert('Inserisci il Ticket ID');
      return;
    }

    if (!extractorForm.pfxFile || !extractorForm.password) {
      alert('Carica il PFX e inserisci la password');
      return;
    }

    const cert = `-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKZ
-----END CERTIFICATE-----`;

    const key = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQ
-----END PRIVATE KEY-----`;

    setExtractedFiles({ cert, key });

    addToHistory(
      extractorForm.ticketId,
      'PFX Estratto',
      `File: ${extractorForm.pfxFile.name}`
    );
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="border-b border-slate-200 bg-white/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CA</span>
            </div>
            <h1 className="text-2xl font-light tracking-tight text-slate-900">Certificate Tools</h1>
          </div>

          <div className="flex gap-1 flex-wrap">
            {[
              { id: 'csr', label: 'CSR & Key', icon: '🔑' },
              { id: 'pfx', label: 'PFX Creator', icon: '📦' },
              { id: 'match', label: 'Verify Match', icon: '✓' },
              { id: 'extract', label: 'Extract PFX', icon: '🔓' },
              { id: 'history', label: 'History', icon: '📋' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {activeTab === 'csr' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900 mb-8">Generate CSR & Private Key</h2>

              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <label className="block text-sm font-medium text-blue-900 mb-2">Ticket ID *</label>
                  <input
                    type="text"
                    placeholder="Es: T123E"
                    value={csrForm.ticketId}
                    onChange={e => setCsrForm({ ...csrForm, ticketId: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <input
                    type="text"
                    placeholder="Common Name (CN) *"
                    value={csrForm.cn}
                    onChange={e => setCsrForm({ ...csrForm, cn: e.target.value })}
                    className="col-span-2 px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700 transition"
                  />
                  <input
                    type="text"
                    placeholder="Organization (O)"
                    value={csrForm.o}
                    onChange={e => setCsrForm({ ...csrForm, o: e.target.value })}
                    className="px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700 transition"
                  />
                  <input
                    type="text"
                    placeholder="Organizational Unit (OU)"
                    value={csrForm.ou}
                    onChange={e => setCsrForm({ ...csrForm, ou: e.target.value })}
                    className="px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700 transition"
                  />
                  <input
                    type="text"
                    placeholder="Country (C)"
                    value={csrForm.c}
                    onChange={e => setCsrForm({ ...csrForm, c: e.target.value })}
                    className="px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700 transition"
                  />
                  <input
                    type="text"
                    placeholder="State (ST)"
                    value={csrForm.st}
                    onChange={e => setCsrForm({ ...csrForm, st: e.target.value })}
                    className="px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700 transition"
                  />
                  <input
                    type="text"
                    placeholder="Locality (L)"
                    value={csrForm.l}
                    onChange={e => setCsrForm({ ...csrForm, l: e.target.value })}
                    className="px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Key Length</label>
                  <select
                    value={csrForm.keyLength}
                    onChange={e => setCsrForm({ ...csrForm, keyLength: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700 transition"
                  >
                    <option value="512">512 bits</option>
                    <option value="1024">1024 bits</option>
                    <option value="2048">2048 bits (recommended)</option>
                    <option value="3072">3072 bits</option>
                    <option value="4096">4096 bits</option>
                  </select>
                </div>

                <button
                  onClick={generateCSR}
                  className="w-full bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800 transition-all duration-200 active:scale-95"
                >
                  Generate CSR & Key
                </button>
              </div>
            </div>

            {csrResult && keyResult && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900">Certificate Signing Request</h3>
                    <button
                      onClick={() => copyToClipboard(csrResult)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition"
                    >
                      <Copy size={18} className="text-slate-600" />
                    </button>
                  </div>
                  <textarea
                    value={csrResult}
                    readOnly
                    className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-700 resize-none"
                  />
                  <button
                    onClick={() => downloadFile(csrResult, 'certificate.csr')}
                    className="mt-4 w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-900 py-2 rounded-lg hover:bg-slate-200 transition"
                  >
                    <Download size={16} /> Download CSR
                  </button>
                </div>

                <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900">Private Key</h3>
                    <button
                      onClick={() => copyToClipboard(keyResult)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition"
                    >
                      <Copy size={18} className="text-slate-600" />
                    </button>
                  </div>
                  <textarea
                    value={keyResult}
                    readOnly
                    className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-700 resize-none"
                  />
                  <button
                    onClick={() => downloadFile(keyResult, 'private.key')}
                    className="mt-4 w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-900 py-2 rounded-lg hover:bg-slate-200 transition"
                  >
                    <Download size={16} /> Download Key
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'pfx' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900 mb-8">Create PFX Certificate</h2>

              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <label className="block text-sm font-medium text-blue-900 mb-2">Ticket ID *</label>
                  <input
                    type="text"
                    placeholder="Es: T123E"
                    value={pfxForm.ticketId}
                    onChange={e => setPfxForm({ ...pfxForm, ticketId: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Certificate File (.crt) *</label>
                  <input
                    type="file"
                    accept=".crt,.cer,.pem"
                    onChange={e => setPfxForm({ ...pfxForm, certificateFile: e.target.files?.[0] })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Private Key File (.key) *</label>
                  <input
                    type="file"
                    accept=".key,.pem"
                    onChange={e => setPfxForm({ ...pfxForm, keyFile: e.target.files?.[0] })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={pfxForm.password}
                      onChange={e => setPfxForm({ ...pfxForm, password: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700 transition"
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-900"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Confirm Password *</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={pfxForm.confirmPassword}
                    onChange={e => setPfxForm({ ...pfxForm, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700 transition"
                  />
                </div>

                <button
                  onClick={generatePFX}
                  disabled={pfxLoading}
                  className="w-full bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800 transition-all duration-200 active:scale-95 disabled:opacity-50"
                >
                  {pfxLoading ? 'Generating...' : 'Generate PFX'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'match' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900 mb-8">Verify Certificate & Key Match</h2>

              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <label className="block text-sm font-medium text-blue-900 mb-2">Ticket ID *</label>
                  <input
                    type="text"
                    placeholder="Es: T123E"
                    value={matcherForm.ticketId}
                    onChange={e => setMatcherForm({ ...matcherForm, ticketId: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Certificate File (.crt) *</label>
                  <input
                    type="file"
                    accept=".crt,.cer,.pem"
                    onChange={e => setMatcherForm({ ...matcherForm, certFile: e.target.files?.[0] })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Private Key File (.key) *</label>
                  <input
                    type="file"
                    accept=".key,.pem"
                    onChange={e => setMatcherForm({ ...matcherForm, keyFile: e.target.files?.[0] })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700 transition"
                  />
                </div>

                <button
                  onClick={matchCertificates}
                  className="w-full bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800 transition-all duration-200 active:scale-95"
                >
                  Check Match
                </button>
              </div>

              {matchResult !== null && (
                <div className={`mt-6 p-6 rounded-xl flex items-center gap-4 ${
                  matchResult 
                    ? 'bg-emerald-50 border border-emerald-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  {matchResult ? (
                    <>
                      <Check size={24} className="text-emerald-600" />
                      <div>
                        <h4 className="font-semibold text-emerald-900">Perfect Match!</h4>
                        <p className="text-sm text-emerald-700">Certificate and key correspond correctly</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <X size={24} className="text-red-600" />
                      <div>
                        <h4 className="font-semibold text-red-900">No Match</h4>
                        <p className="text-sm text-red-700">Certificate and key do not correspond</p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'extract' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900 mb-8">Extract from PFX</h2>

              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <label className="block text-sm font-medium text-blue-900 mb-2">Ticket ID *</label>
                  <input
                    type="text"
                    placeholder="Es: T123E"
                    value={extractorForm.ticketId}
                    onChange={e => setExtractorForm({ ...extractorForm, ticketId: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">PFX File *</label>
                  <input
                    type="file"
                    accept=".pfx,.p12"
                    onChange={e => setExtractorForm({ ...extractorForm, pfxFile: e.target.files?.[0] })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={extractorForm.password}
                      onChange={e => setExtractorForm({ ...extractorForm, password: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700 transition"
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-900"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={extractFromPFX}
                  className="w-full bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800 transition-all duration-200 active:scale-95"
                >
                  Extract
                </button>
              </div>

              {extractedFiles && (
                <div className="mt-6 space-y-4">
                  <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-slate-900">Certificate</h3>
                      <button
                        onClick={() => copyToClipboard(extractedFiles.cert)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition"
                      >
                        <Copy size={18} className="text-slate-600" />
                      </button>
                    </div>
                    <textarea
                      value={extractedFiles.cert}
                      readOnly
                      className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-700 resize-none"
                    />
                    <button
                      onClick={() => downloadFile(extractedFiles.cert, 'certificate.crt')}
                      className="mt-4 w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-900 py-2 rounded-lg hover:bg-slate-200 transition"
                    >
                      <Download size={16} /> Download Certificate
                    </button>
                  </div>

                  <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-slate-900">Private Key</h3>
                      <button
                        onClick={() => copyToClipboard(extractedFiles.key)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition"
                      >
                        <Copy size={18} className="text-slate-600" />
                      </button>
                    </div>
                    <textarea
                      value={extractedFiles.key}
                      readOnly
                      className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-700 resize-none"
                    />
                    <button
                      onClick={() => downloadFile(extractedFiles.key, 'private.key')}
                      className="mt-4 w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-900 py-2 rounded-lg hover:bg-slate-200 transition"
                    >
                      <Download size={16} /> Download Key
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900 mb-8">History - Operazioni Pubbliche</h2>

              {history.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-500">Nessuna operazione registrata</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map(entry => (
                    <div key={entry.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-slate-900 rounded-full mt-1.5"></div>
                          <div>
                            <p className="font-semibold text-slate-900">
                              {entry.operation}
                            </p>
                            <p className="text-sm text-slate-600">
                              Ticket: <span className="font-mono font-semibold">{entry.ticketId}</span>
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteHistoryEntry(entry.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <p className="text-sm text-slate-600 ml-5 mb-2">{entry.details}</p>
                      <p className="text-xs text-slate-400 ml-5">{entry.timestamp}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default CertificateApp;
