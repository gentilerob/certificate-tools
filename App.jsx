import React, { useState } from 'react';
import { Download, Upload, Check, X, Copy, Eye, EyeOff } from 'lucide-react';

const CertificateApp = () => {
  const [activeTab, setActiveTab] = useState('csr');
  const [showPassword, setShowPassword] = useState(false);

  // CSR Generator State
  const [csrForm, setCsrForm] = useState({
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

  // PFX Creator State
  const [pfxForm, setPfxForm] = useState({
    certificateFile: null,
    keyFile: null,
    password: '',
    confirmPassword: '',
  });
  const [pfxLoading, setPfxLoading] = useState(false);

  // Matcher State
  const [matcherCert, setMatcherCert] = useState(null);
  const [matcherKey, setMatcherKey] = useState(null);
  const [matchResult, setMatchResult] = useState(null);

  // Extractor State
  const [extractorPfx, setExtractorPfx] = useState(null);
  const [extractorPassword, setExtractorPassword] = useState('');
  const [extractedFiles, setExtractedFiles] = useState(null);

  // Load node-forge
  const loadForge = async () => {
    if (!window.forge) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/forge/1.3.0/forge.all.min.js';
      document.head.appendChild(script);
      return new Promise(resolve => {
        script.onload = () => resolve();
      });
    }
  };

  const generateCSR = async () => {
    await loadForge();
    const forge = window.forge;

    try {
      // Generate keypair
      const keypair = forge.pki.rsa.generateKeyPair(parseInt(csrForm.keyLength));

      // Create CSR
      const csr = forge.pki.createCertificationRequest();
      csr.publicKey = keypair.publicKey;
      csr.setSubject([
        { name: 'commonName', value: csrForm.cn },
        { name: 'organizationName', value: csrForm.o },
        { name: 'organizationalUnitName', value: csrForm.ou },
        { name: 'countryName', value: csrForm.c },
        { name: 'stateOrProvinceName', value: csrForm.st },
        { name: 'localityName', value: csrForm.l },
      ]);
      csr.sign(keypair.privateKey, forge.md.sha256.create());

      const csrPem = forge.pki.certificationRequestToPem(csr);
      const keyPem = forge.pki.privateKeyToPem(keypair.privateKey);

      setCsrResult(csrPem);
      setKeyResult(keyPem);
    } catch (error) {
      alert('Errore nella generazione: ' + error.message);
    }
  };

  const downloadFile = (content, filename) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  const generatePFX = async () => {
    await loadForge();
    const forge = window.forge;

    if (!pfxForm.certificateFile || !pfxForm.keyFile || !pfxForm.password) {
      alert('Riempi tutti i campi');
      return;
    }

    if (pfxForm.password !== pfxForm.confirmPassword) {
      alert('Le password non corrispondono');
      return;
    }

    setPfxLoading(true);
    try {
      const certPem = await pfxForm.certificateFile.text();
      const keyPem = await pfxForm.keyFile.text();

      const cert = forge.pki.certificateFromPem(certPem);
      const key = forge.pki.privateKeyFromPem(keyPem);

      const p12Asn1 = forge.pkcs12.toPkcs12Asn1(key, [cert], pfxForm.password);
      const p12Der = forge.asn1.toDer(p12Asn1).bytes();
      const p12b64 = forge.util.encode64(p12Der);

      const blob = new Blob([forge.util.decode64(p12b64)], { type: 'application/x-pkcs12' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'certificate.pfx';
      a.click();

      alert('PFX generato con successo!');
    } catch (error) {
      alert('Errore: ' + error.message);
    } finally {
      setPfxLoading(false);
    }
  };

  const matchCertificates = async () => {
    await loadForge();
    const forge = window.forge;

    if (!matcherCert || !matcherKey) {
      alert('Carica entrambi i file');
      return;
    }

    try {
      const certPem = await matcherCert.text();
      const keyPem = await matcherKey.text();

      const cert = forge.pki.certificateFromPem(certPem);
      const key = forge.pki.privateKeyFromPem(keyPem);

      const certPublicKey = cert.publicKey;
      const keyPublicKey = key.publicKey;

      const certModulus = certPublicKey.n.toString();
      const keyModulus = keyPublicKey.n.toString();

      const match = certModulus === keyModulus;
      setMatchResult(match);
    } catch (error) {
      alert('Errore: ' + error.message);
    }
  };

  const extractFromPFX = async () => {
    await loadForge();
    const forge = window.forge;

    if (!extractorPfx || !extractorPassword) {
      alert('Carica il PFX e inserisci la password');
      return;
    }

    try {
      const pfxData = await extractorPfx.arrayBuffer();
      const pfxAsn1 = forge.asn1.fromDer(forge.util.createBuffer(pfxData));
      const p12 = forge.pkcs12.asn1Decode(pfxAsn1, extractorPassword);

      let cert = null;
      let key = null;

      // Extract certificate
      if (p12.bags.certificateBag && p12.bags.certificateBag.length > 0) {
        cert = forge.pki.certificateToPem(p12.bags.certificateBag[0].cert);
      }

      // Extract key
      if (p12.bags.keyBag && p12.bags.keyBag.length > 0) {
        key = forge.pki.privateKeyToPem(p12.bags.keyBag[0].key);
      }

      setExtractedFiles({ cert, key });
    } catch (error) {
      alert('Errore (password errata?): ' + error.message);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CA</span>
            </div>
            <h1 className="text-2xl font-light tracking-tight text-slate-900">Certificate Tools</h1>
          </div>

          {/* Tabs */}
          <div className="flex gap-1">
            {[
              { id: 'csr', label: 'CSR & Key', icon: '🔑' },
              { id: 'pfx', label: 'PFX Creator', icon: '📦' },
              { id: 'match', label: 'Verify Match', icon: '✓' },
              { id: 'extract', label: 'Extract PFX', icon: '🔓' },
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

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* CSR Generator */}
        {activeTab === 'csr' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900 mb-8">Generate CSR & Private Key</h2>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <input
                  type="text"
                  placeholder="Common Name (CN)"
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

              <div className="mb-8">
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

            {/* Results */}
            {csrResult && keyResult && (
              <div className="space-y-4 animate-fadeIn">
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

        {/* PFX Creator */}
        {activeTab === 'pfx' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900 mb-8">Create PFX Certificate</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Certificate File (.crt)</label>
                  <input
                    type="file"
                    accept=".crt,.cer,.pem"
                    onChange={e => setPfxForm({ ...pfxForm, certificateFile: e.target.files?.[0] })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Private Key File (.key)</label>
                  <input
                    type="file"
                    accept=".key,.pem"
                    onChange={e => setPfxForm({ ...pfxForm, keyFile: e.target.files?.[0] })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
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
                  <label className="block text-sm font-medium text-slate-700 mb-2">Confirm Password</label>
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

        {/* Certificate Matcher */}
        {activeTab === 'match' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900 mb-8">Verify Certificate & Key Match</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Certificate File (.crt)</label>
                  <input
                    type="file"
                    accept=".crt,.cer,.pem"
                    onChange={e => setMatcherCert(e.target.files?.[0])}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Private Key File (.key)</label>
                  <input
                    type="file"
                    accept=".key,.pem"
                    onChange={e => setMatcherKey(e.target.files?.[0])}
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

        {/* PFX Extractor */}
        {activeTab === 'extract' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900 mb-8">Extract from PFX</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">PFX File</label>
                  <input
                    type="file"
                    accept=".pfx,.p12"
                    onChange={e => setExtractorPfx(e.target.files?.[0])}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={extractorPassword}
                      onChange={e => setExtractorPassword(e.target.value)}
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
                <div className="mt-6 space-y-4 animate-fadeIn">
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
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default CertificateApp;
