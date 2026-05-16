/* global React, ReactDOM, DesignCanvas, DCSection, DCArtboard, DCPostIt,
   TweaksPanel, useTweaks, TweakSection, TweakColor, TweakRadio, TweakToggle,
   Frame, HandNote, SB_LIGHT, SB_DARK,
   Foundation,
   LibraryDesktopArtifact, LibraryMobileArtifact, LibraryDesktopSpeed, LibraryMobileSpeed,
   EmptyDesktop, EmptyMobile, AddDesktop, AddMobile, DragOverDesktop,
   RunDesktop, RunMobile, DetailsDesktop, DetailsMobile,
   ComposeDesktop, ComposeMobile,
   SettingsDesktop, SettingsMobile,
   Appearance, Dependencies, Storage, Logs, Featured, About, Credits,
   LongPressMobile, RightClickDesktop, DeleteConfirm, URLImport
*/

const TWEAKS = /*EDITMODE-BEGIN*/{
  "accent": "#e8c547",
  "accentSoft": "#fdf6dc",
  "canvas": "paper"
}/*EDITMODE-END*/;

const ACCENT_PRESETS = {
  '#e8c547': '#fdf6dc',  // yellow (SANDBOX default)
  '#e3a98e': '#fce6da',  // clay
  '#bcd5ec': '#e5eff8',  // sky
  '#d6c8e8': '#ece4f4',  // lilac
  '#d6e2c8': '#eaf2dd',  // sage
};

function applyAccent(hex) {
  const soft = ACCENT_PRESETS[hex] || '#fdf6dc';
  SB_LIGHT.accent = hex;
  SB_LIGHT.accentSoft = soft;
  SB_DARK.accent = hex;
  // Dark accentSoft — derive a low-lightness soft tone
  SB_DARK.accentSoft = '#3a3216';
}

function App() {
  const [t, setTweak] = useTweaks(TWEAKS);

  // Apply accent on every render so wireframes pick it up
  applyAccent(t.accent);

  const canvasBg = t.canvas === 'dark' ? '#1e1d1a' : '#ece8de';
  React.useEffect(() => { document.body.style.background = canvasBg; }, [canvasBg]);

  // small helper for artboard label color when canvas is dark
  return (
    <>
      <TweaksPanel title="Tweaks">
        <TweakSection title="Accent">
          <TweakColor
            label="Accent color"
            value={t.accent}
            onChange={(v) => setTweak('accent', v)}
            options={Object.keys(ACCENT_PRESETS)}
          />
          <div style={{ fontSize: 11, color: '#888', marginTop: 6, lineHeight: 1.45 }}>
            Used for highlights, selection, the "Add" CTA, and the SANDBOX logo.
          </div>
        </TweakSection>
        <TweakSection title="Canvas">
          <TweakRadio
            label="Background"
            value={t.canvas}
            onChange={(v) => setTweak('canvas', v)}
            options={[{ value: 'paper', label: 'Paper' }, { value: 'dark', label: 'Dark' }]}
          />
          <div style={{ fontSize: 11, color: '#888', marginTop: 6, lineHeight: 1.45 }}>
            Hero screens still show both light + dark frames side-by-side regardless — this only re-tints the canvas behind them.
          </div>
        </TweakSection>
      </TweaksPanel>

      <DesignCanvas key={t.accent + t.canvas}>

        {/* ─────────────────────────────────────────────────── */}
        <DCSection id="foundation" title="00 · Foundation" subtitle="Tokens, type, app-icon system">
          <DCArtboard id="tokens" label="Tokens · type · icon system" width={1200} height={640}>
            <Foundation />
          </DCArtboard>
        </DCSection>

        {/* ─────────────────────────────────────────────────── */}
        <DCSection id="library-a" title="01 · Library — A · Artifact-emphasis" subtitle="Big tiles · minimal chrome · the closest sibling to the Android app">
          <DCArtboard id="la-desk-l" label="Desktop · Light" width={1240} height={780}>
            <LibraryDesktopArtifact mode="light" />
          </DCArtboard>
          <DCArtboard id="la-mob-l" label="Mobile · Light" width={360} height={740}>
            <LibraryMobileArtifact mode="light" />
          </DCArtboard>
          <DCArtboard id="la-desk-d" label="Desktop · Dark" width={1240} height={780}>
            <LibraryDesktopArtifact mode="dark" />
          </DCArtboard>
          <DCArtboard id="la-mob-d" label="Mobile · Dark" width={360} height={740}>
            <LibraryMobileArtifact mode="dark" />
          </DCArtboard>
        </DCSection>

        {/* ─────────────────────────────────────────────────── */}
        <DCSection id="library-b" title="02 · Library — B · Speed-emphasis" subtitle="Compact list · command bar · keyboard-first">
          <DCArtboard id="lb-desk-l" label="Desktop · Light" width={1240} height={780}>
            <LibraryDesktopSpeed mode="light" />
          </DCArtboard>
          <DCArtboard id="lb-mob-l" label="Mobile · Light" width={360} height={740}>
            <LibraryMobileSpeed mode="light" />
          </DCArtboard>
          <DCArtboard id="lb-desk-d" label="Desktop · Dark" width={1240} height={780}>
            <LibraryDesktopSpeed mode="dark" />
          </DCArtboard>
          <DCArtboard id="lb-mob-d" label="Mobile · Dark" width={360} height={740}>
            <LibraryMobileSpeed mode="dark" />
          </DCArtboard>
        </DCSection>

        {/* ─────────────────────────────────────────────────── */}
        <DCSection id="empty" title="03 · Empty · First-run" subtitle="No artifacts yet — show what dropping one in does">
          <DCArtboard id="empty-desk" label="Desktop" width={1240} height={780}>
            <EmptyDesktop mode="light" />
          </DCArtboard>
          <DCArtboard id="empty-mob" label="Mobile" width={360} height={740}>
            <EmptyMobile mode="light" />
          </DCArtboard>
          <DCArtboard id="empty-mob-d" label="Mobile · Dark" width={360} height={740}>
            <EmptyMobile mode="dark" />
          </DCArtboard>
        </DCSection>

        {/* ─────────────────────────────────────────────────── */}
        <DCSection id="add" title="04 · Add to Library" subtitle="Drop-drag · paste · file pick · URL → the unified Share/Import surface">
          <DCArtboard id="add-desk" label="Desktop · centered modal" width={1240} height={780}>
            <AddDesktop mode="light" />
          </DCArtboard>
          <DCArtboard id="add-mob" label="Mobile · bottom sheet" width={360} height={740}>
            <AddMobile mode="light" />
          </DCArtboard>
          <DCArtboard id="dragover" label="Desktop · drag-over state" width={1000} height={680}>
            <DragOverDesktop mode="light" />
          </DCArtboard>
          <DCArtboard id="url-mob" label="Mobile · URL import (fetching)" width={360} height={740}>
            <URLImport mode="light" />
          </DCArtboard>
        </DCSection>

        {/* ─────────────────────────────────────────────────── */}
        <DCSection id="run" title="05 · Run · sandboxed iframe runtime" subtitle="Persistent dock — name + controls always visible — light + dark">
          <DCArtboard id="run-desk-l" label="Desktop · Light · mounted" width={1240} height={800}>
            <RunDesktop mode="light" state="mounted" />
          </DCArtboard>
          <DCArtboard id="run-mob-l" label="Mobile · Light" width={360} height={740}>
            <RunMobile mode="light" />
          </DCArtboard>
          <DCArtboard id="run-desk-d" label="Desktop · Dark · mounted" width={1240} height={800}>
            <RunDesktop mode="dark" state="mounted" />
          </DCArtboard>
          <DCArtboard id="run-mob-d" label="Mobile · Dark" width={360} height={740}>
            <RunMobile mode="dark" />
          </DCArtboard>
        </DCSection>

        {/* ─────────────────────────────────────────────────── */}
        <DCSection id="run-states" title="06 · Run · loading + error states" subtitle="Boot delay, JS error overlay, and the non-blocking offline banner">
          <DCArtboard id="run-loading" label="Desktop · loading" width={1100} height={680}>
            <RunDesktop mode="light" state="loading" />
          </DCArtboard>
          <DCArtboard id="run-error" label="Desktop · error" width={1100} height={680}>
            <RunDesktop mode="light" state="error" />
          </DCArtboard>
        </DCSection>

        {/* ─────────────────────────────────────────────────── */}
        <DCSection id="details" title="07 · Details" subtitle="Per-artifact metadata + actions">
          <DCArtboard id="det-desk" label="Desktop" width={1240} height={780}>
            <DetailsDesktop mode="light" />
          </DCArtboard>
          <DCArtboard id="det-mob" label="Mobile" width={360} height={740}>
            <DetailsMobile mode="light" />
          </DCArtboard>
          <DCArtboard id="det-mob-d" label="Mobile · with deps · Dark" width={360} height={740}>
            <DetailsMobile mode="dark" />
          </DCArtboard>
        </DCSection>

        {/* ─────────────────────────────────────────────────── */}
        <DCSection id="compose" title="08 · Compose · code editor" subtitle="Create-from-scratch or edit-source · imports re-detected on save">
          <DCArtboard id="comp-desk" label="Desktop" width={1240} height={800}>
            <ComposeDesktop mode="light" />
          </DCArtboard>
          <DCArtboard id="comp-mob" label="Mobile" width={360} height={740}>
            <ComposeMobile mode="light" />
          </DCArtboard>
          <DCArtboard id="comp-desk-d" label="Desktop · Dark" width={1240} height={800}>
            <ComposeDesktop mode="dark" />
          </DCArtboard>
        </DCSection>

        {/* ─────────────────────────────────────────────────── */}
        <DCSection id="settings" title="09 · Settings · hub" subtitle="Grouped list — appearance, deps, storage, logs, about, reset">
          <DCArtboard id="set-desk-l" label="Desktop · Light" width={1240} height={780}>
            <SettingsDesktop mode="light" />
          </DCArtboard>
          <DCArtboard id="set-mob-l" label="Mobile · Light" width={360} height={740}>
            <SettingsMobile mode="light" />
          </DCArtboard>
          <DCArtboard id="set-desk-d" label="Desktop · Dark" width={1240} height={780}>
            <SettingsDesktop mode="dark" />
          </DCArtboard>
          <DCArtboard id="set-mob-d" label="Mobile · Dark" width={360} height={740}>
            <SettingsMobile mode="dark" />
          </DCArtboard>
        </DCSection>

        {/* ─────────────────────────────────────────────────── */}
        <DCSection id="sub-screens" title="10 · Settings · sub-screens" subtitle="Each is a mobile-sized leaf — desktop reuses the same content in the SPA's center column">
          <DCArtboard id="sub-appearance" label="Appearance" width={360} height={740}>
            <Appearance mode="light" />
          </DCArtboard>
          <DCArtboard id="sub-deps" label="Dependencies" width={360} height={740}>
            <Dependencies mode="light" />
          </DCArtboard>
          <DCArtboard id="sub-storage" label="Storage" width={360} height={740}>
            <Storage mode="light" />
          </DCArtboard>
          <DCArtboard id="sub-logs" label="Logs" width={360} height={740}>
            <Logs mode="dark" />
          </DCArtboard>
          <DCArtboard id="sub-featured" label="Featured" width={360} height={740}>
            <Featured mode="light" />
          </DCArtboard>
          <DCArtboard id="sub-about" label="About" width={360} height={740}>
            <About mode="light" />
          </DCArtboard>
          <DCArtboard id="sub-credits" label="Credits" width={360} height={740}>
            <Credits mode="light" />
          </DCArtboard>
        </DCSection>

        {/* ─────────────────────────────────────────────────── */}
        <DCSection id="interactions" title="11 · Interactions" subtitle="Long-press · right-click · destructive confirm">
          <DCArtboard id="longpress" label="Mobile · long-press menu" width={360} height={740}>
            <LongPressMobile mode="light" />
          </DCArtboard>
          <DCArtboard id="rightclick" label="Desktop · right-click menu" width={1100} height={620}>
            <RightClickDesktop mode="light" />
          </DCArtboard>
          <DCArtboard id="delete" label="Delete dep · confirm" width={680} height={520}>
            <DeleteConfirm mode="light" />
          </DCArtboard>
        </DCSection>

      </DesignCanvas>
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
