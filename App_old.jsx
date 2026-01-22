import React, { useState, useEffect } from 'react';
import { Download, Upload, Check, X, Copy, Eye, EyeOff } from 'lucide-react';

const CertificateApp = () => {
  const [jsRSA, setJsRSA] = useState(null);
  const [loading, setLoading] = useState(true);
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

  // Load jsrsasign on mount
  useEffect(() => {
    const loadLibrary = async () => {
      try {
        const KJUR = await import('jsrsasign');
        setJsRSA(KJUR);
        setLoading(false);
      } catch (error) {
        console.error('Errore nel caricamento:', error);
        setLoading(false);
      }
    };
    loadLibrary();
  }, []);

  const generateCSR = () => {
    if (!jsRSA) {
      alert('Libreria in caricamento, riprova tra un secondo');
      return;
    }

    if (!csrForm.cn) {
      alert('Riempi almeno il Common Name (CN)');
      return;
    }

    try {
      const KJUR = jsRSA.default || jsRSA;
      
      // Generate RSA key
      const RSAKey = KJUR.RSAKey;
      const rsa = new RSAKey();
      rsa.generateAsync(parseInt(csrForm.keyLength), '10001', () => {
        const keyPem = rsa.exportPrivateKeyPEM();

        // Create CSR
        const csrobj = new KJUR.asn1.csr.CertificationRequest({
          subject: {
            name: csrForm.cn,
            C: csrForm.c,
            ST: csrForm.st,
            L: csrForm.l,
            O: csrForm.o,
            OU: csrForm.ou,
            CN: csrForm.cn
          },
          sbjpubkey: rsa,
          sigalg: 'sha256WithRSAEncryption',
          sigkey: rsa
        });

        const csrPem = csrobj.getPEM();
        setCsrResult(csrPem);
        setKeyResult(keyPem);
      });
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
    window.URL.revokeObjectURL(url);
  };

  const generatePFX = () => {
    if (!jsRSA) {
      alert('Libreria in caricamento, riprova tra un secondo');
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
    
    const certReader = new FileReader();
    const keyReader = new FileReader();
    
    let certPem = '';
    let keyPem = '';
    let filesRead = 0;

    const createP12 = () => {
      try {
        const KJUR = jsRSA.default || jsRSA;
        
        // Parse certificate and key
        const cert = new KJUR.X509();
        cert.readCertPEM(certPem);
        
        const rsa = new KJUR.RSAKey();
        rsa.readPrivateKeyFromPEM(keyPem);

        // Create PKCS12
        const p12 = new KJUR.asn1.pkcs12.PFX({
          certs: [cert],
          keys: [rsa],
          password: pfxForm.password
        });

        const p12hex = p12.toHex ? p12.toHex() : p12.getPEM();
        const p12bytes = KJUR.rstrtohex ? 
          KJUR.rstrtohex(KJUR.hextorstr(p12hex)) : 
          p12hex;

        // Download PFX
        const blob = new Blob([new Uint8Array(p12bytes.match(/.{1,2}/g).map(byte => parseInt(byte, 16)))], { 
          type: 'application/x-pkcs12' 
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'certificate.pfx';
        a.click();
        window.URL.revokeObjectURL(url);

        alert('PFX generato con successo!');
        setPfxLoading(false);
      } catch (error) {
        alert('Errore nella creazione PFX: ' + error.message);
        setPfxLoading(false);
      }
    };

    certReader.onload = (e) => {
      certPem = e.target.result;
      filesRead++;
      if (filesRead === 2) createP12();
    };

    keyReader.onload = (e) => {
      keyPem = e.target.result;
      filesRead++;
      if (filesRead === 2) createP12();
    };

    certReader.readAsText(pfxForm.certificateFile);
    keyReader.readAsText(pfxForm.keyFile);
  };

  const matchCertificates = () => {
    if (!jsRSA) {
      alert('Libreria in caricamento, riprova tra un secondo');
      return;
    }

    if (!matcherCert || !matcherKey) {
      alert('Carica entrambi i file');
      return;
    }

    const certReader = new FileReader();
    const keyReader = new FileReader();
    
    let certPem = '';
    let keyPem = '';
    let filesRead = 0;

    const compare = () => {
      try {
        const KJUR = jsRSA.default || jsRSA;
        
        const cert = new KJUR.X509();
        cert.readCertPEM(certPem);
        
        const rsa = new KJUR.RSAKey();
        rsa.readPrivateKeyFromPEM(keyPem);

        // Get modulus from both
        const certModulus = cert.getPublicKeyObject().n.toString();
        const keyModulus = rsa.n.toString();

        const match = certModulus === keyModulus;
        setMatchResult(match);
      } catch (error) {
        alert('Errore nel confronto: ' + error.message);
      }
    };

    certReader.onload = (e) => {
      certPem = e.target.result;
      filesRead++;
      if (filesRead === 2) compare();
    };

    keyReader.onload = (e) => {
      keyPem = e.target.result;
      filesRead++;
      if (filesRead === 2) compare();
    };

    certReader.readAsText(matcherCert);
    keyReader.readAsText(matcherKey);
  };

  const extractFromPFX = () => {
    if (!jsRSA) {
      alert('Libreria in caricamento, riprova tra un secondo');
      return;
    }

    if (!extractorPfx || !extractorPassword) {
      alert('Carica il PFX e inserisci la password');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const KJUR = jsRSA.default || jsRSA;
          const data = e.target.result;
          
          // Parse PKCS12
          const p12 = new KJUR.asn1.pkcs12.PFX();
          p12.parseHex(data);
          
          const certs = p12.getCerts();
          const keys = p12.getKeys();

          let cert = null;
          let key = null;

          if (certs && certs.length > 0) {
            cert = certs[0].getPEM ? certs[0].getPEM() : new KJUR.X509(certs[0]).getPEM();
          }

          if (keys && keys.length > 0) {
            key = keys[0].exportPrivateKeyPEM ? keys[0].exportPrivateKeyPEM() : keys[0];
          }

          if (cert && key) {
            setExtractedFiles({ cert, key });
          } else {
            alert('Impossibile estrarre certificato o chiave dal PFX');
          }
        } catch (error) {
          alert('Errore nell\'estrazione (password errata?): ' + error.message);
        }
      };
      reader.readAsArrayBuffer(extractorPfx);
    } catch (error) {
      alert('Errore: ' + error.message);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-900 mb-4"></div>
          <p className="text-slate-600">Caricamento librerie...</p>
        </div>
      </div>
    );
  }

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
