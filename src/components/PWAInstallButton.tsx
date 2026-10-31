import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Monitor, X, Check, HelpCircle } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<'desktop' | 'mobile' | null>(null);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowChoiceModal(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallDesktop = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } else {
      setSelectedPlatform('desktop');
    }
  };

  if (isInstalled) return null;

  return (
    <>
      <button
        onClick={() => setShowChoiceModal(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer whitespace-nowrap"
        title="Instalar versión de ordenador o celular"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Instalar App</span>
      </button>

      {/* Modal de Selección de Versión (Ordenador o Celular) */}
      {showChoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-slate-900 space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Seleccione la Versión a Instalar</h3>
                  <p className="text-3xs text-slate-500">Elija el dispositivo donde desea instalar Prenómina de Salario</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowChoiceModal(false);
                  setSelectedPlatform(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!selectedPlatform ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Opción Ordenador / Desktop */}
                <button
                  type="button"
                  onClick={handleInstallDesktop}
                  className="p-4 rounded-xl border-2 border-slate-200 hover:border-blue-600 hover:bg-blue-50/40 text-left transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="p-2.5 bg-slate-100 group-hover:bg-blue-600 group-hover:text-white rounded-lg w-fit text-slate-700 transition-colors">
                      <Monitor className="w-5 h-5" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 mt-3">Versión de Ordenador</h4>
                    <p className="text-3xs text-slate-500 mt-1 leading-relaxed">
                      Para Windows, macOS o Linux. Crea un acceso directo en el escritorio y se ejecuta como app de escritorio.
                    </p>
                  </div>
                  <span className="text-3xs font-semibold text-blue-600 group-hover:underline mt-4 inline-block">
                    Instalar en PC/Mac →
                  </span>
                </button>

                {/* Opción Celular / Mobile */}
                <button
                  type="button"
                  onClick={() => setSelectedPlatform('mobile')}
                  className="p-4 rounded-xl border-2 border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/40 text-left transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="p-2.5 bg-slate-100 group-hover:bg-emerald-600 group-hover:text-white rounded-lg w-fit text-slate-700 transition-colors">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 mt-3">Versión de Celular</h4>
                    <p className="text-3xs text-slate-500 mt-1 leading-relaxed">
                      Para teléfonos Android y iPhone / iPad (iOS). Se instala en la pantalla de inicio como una app móvil.
                    </p>
                  </div>
                  <span className="text-3xs font-semibold text-emerald-700 group-hover:underline mt-4 inline-block">
                    Ver guía móvil →
                  </span>
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {selectedPlatform === 'desktop' && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2.5">
                    <h4 className="font-bold text-blue-950 flex items-center gap-1.5">
                      <Monitor className="w-4 h-4 text-blue-600" />
                      <span>Instalación en Ordenador (PC / Mac)</span>
                    </h4>
                    <p className="text-blue-900 leading-relaxed">
                      {deferredPrompt ? (
                        <>Haga clic en el botón de abajo para iniciar la instalación automática en su navegador.</>
                      ) : (
                        <>
                          Su navegador permite la instalación directa. En la barra de direcciones (arriba a la derecha), haga clic en el icono de instalación <strong>(icono de monitor con flecha ↓)</strong> o abra el menú del navegador y seleccione <strong>"Instalar Prenómina de Salario..."</strong>.
                        </>
                      )}
                    </p>
                    {deferredPrompt && (
                      <button
                        type="button"
                        onClick={async () => {
                          await deferredPrompt.prompt();
                          setShowChoiceModal(false);
                        }}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors cursor-pointer mt-2"
                      >
                        Instalar Ahora en este Ordenador
                      </button>
                    )}
                  </div>
                )}

                {selectedPlatform === 'mobile' && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
                    <h4 className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-emerald-700" />
                      <span>Instalación en Celular o Tablet (Android / iOS)</span>
                    </h4>
                    <div className="space-y-2 text-emerald-950">
                      <div className="p-2 bg-white rounded-lg border border-emerald-200">
                        <span className="font-bold block text-2xs text-emerald-900 mb-0.5">🤖 En Android (Chrome / Firefox):</span>
                        Abra el menú superior derecho (tres puntos <strong>⋮</strong>) y seleccione <strong>"Instalar aplicación"</strong> o <strong>"Añadir a la pantalla principal"</strong>.
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-emerald-200">
                        <span className="font-bold block text-2xs text-emerald-900 mb-0.5">🍏 En iPhone / iPad (Safari):</span>
                        Pulse el botón <strong>Compartir (icono con flecha hacia arriba)</strong> en la barra inferior y seleccione <strong>"Añadir a la pantalla de inicio"</strong>.
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPlatform(null)}
                    className="text-xs text-slate-600 hover:text-slate-900 underline cursor-pointer font-medium"
                  >
                    ← Volver a elegir dispositivo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowChoiceModal(false);
                      setSelectedPlatform(null);
                    }}
                    className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-3xs text-slate-500 font-mono">
              <HelpCircle className="w-3 h-3 text-slate-400" />
              <span>Funciona sin conexión (Offline-first PWA)</span>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
