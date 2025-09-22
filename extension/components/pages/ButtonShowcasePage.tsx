import React from 'react';
import '../styles/ButtonShowcasePage.css';
import '../styles/Buttons.css';

const ButtonShowcasePage = () => {
  return (
    <div className="button-showcase-page">
      <div className="page-header">
        <h1>Showcase des Boutons</h1>
        <p>Tous les styles de boutons disponibles</p>
      </div>

      <div className="button-sections">
        {/* Boutons Primary */}
        <section className="button-section">
          <h2>Boutons Primary</h2>
          <div className="button-group-demo">
            <button className="btn btn-primary btn-sm">Small Primary</button>
            <button className="btn btn-primary btn-default">Primary</button>
            <button className="btn btn-primary btn-lg">Large Primary</button>
          </div>
        </section>

        {/* Boutons Secondary */}
        <section className="button-section">
          <h2>Boutons Secondary</h2>
          <div className="button-group-demo">
            <button className="btn btn-secondary btn-sm">Small Secondary</button>
            <button className="btn btn-secondary btn-default">Secondary</button>
            <button className="btn btn-secondary btn-lg">Large Secondary</button>
          </div>
        </section>

        {/* Boutons Outline */}
        <section className="button-section">
          <h2>Boutons Outline</h2>
          <div className="button-group-demo">
            <button className="btn btn-outline btn-sm">Small Outline</button>
            <button className="btn btn-outline btn-default">Outline</button>
            <button className="btn btn-outline btn-lg">Large Outline</button>
          </div>
        </section>

        {/* Boutons Ghost */}
        <section className="button-section">
          <h2>Boutons Ghost</h2>
          <div className="button-group-demo">
            <button className="btn btn-ghost btn-sm">Small Ghost</button>
            <button className="btn btn-ghost btn-default">Ghost</button>
            <button className="btn btn-ghost btn-lg">Large Ghost</button>
          </div>
        </section>

        {/* Boutons Destructive */}
        <section className="button-section">
          <h2>Boutons Destructive</h2>
          <div className="button-group-demo">
            <button className="btn btn-destructive btn-sm">Small Destructive</button>
            <button className="btn btn-destructive btn-default">Destructive</button>
            <button className="btn btn-destructive btn-lg">Large Destructive</button>
          </div>
        </section>

        {/* Boutons avec icônes */}
        <section className="button-section">
          <h2>Boutons Icon</h2>
          <div className="button-group-demo">
            <button className="btn btn-primary btn-icon btn-sm">⚙</button>
            <button className="btn btn-primary btn-icon">⚙</button>
            <button className="btn btn-primary btn-icon btn-lg">⚙</button>
          </div>
        </section>

        {/* États spéciaux */}
        <section className="button-section">
          <h2>États Spéciaux</h2>
          <div className="button-group-demo">
            <button className="btn btn-primary btn-default" disabled>Disabled</button>
            <button className="btn btn-primary btn-default btn-loading">Loading</button>
            <button className="btn btn-primary btn-full">Pleine largeur</button>
          </div>
        </section>

        {/* Groupe de boutons */}
        <section className="button-section">
          <h2>Groupe de Boutons</h2>
          <div className="btn-group">
            <button className="btn btn-outline">Premier</button>
            <button className="btn btn-outline">Deuxième</button>
            <button className="btn btn-outline">Troisième</button>
          </div>
        </section>

        {/* Boutons de filtre */}
        <section className="button-section">
          <h2>Boutons de Filtre</h2>
          <div className="button-group-demo">
            <button className="btn-filter">Tous</button>
            <button className="btn-filter selected">Actif</button>
            <button className="btn-filter">Inactif</button>
            <button className="btn-filter">En attente</button>
          </div>
          <p style={{marginTop: '16px', fontSize: '14px', color: 'var(--muted-foreground)'}}>
            All
          </p>
        </section>
      </div>
    </div>
  );
};

export default ButtonShowcasePage;