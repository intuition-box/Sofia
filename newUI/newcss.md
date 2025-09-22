@tailwind base;
@tailwind components;
@tailwind utilities;

/* Definition of the design system. All colors, gradients, fonts, etc should be defined here. 
All colors MUST be HSL.
*/

@layer base {
  :root {
    /* Votre palette de couleurs Chrome Extension */
    --background: 45 100% 98%; /* FFFCF5 - Couleur la plus claire pour les backgrounds */
    --foreground: 50 25% 25%; /* 4E4938 - Couleur la plus foncée pour le texte */

    --card: 45 100% 98%; /* FFFCF5 - Cards sur fond clair */
    --card-foreground: 50 25% 25%; /* 4E4938 - Texte des cards */

    --popover: 45 100% 98%;
    --popover-foreground: 50 25% 25%;

    --primary: 45 32% 46%; /* 9B8750 - Couleur principale (brun doré) */
    --primary-foreground: 45 100% 98%; /* FFFCF5 - Texte sur primary */

    --secondary: 50 15% 66%; /* AAA292 - Couleur secondaire */
    --secondary-foreground: 50 25% 25%; /* 4E4938 - Texte sur secondary */

    --muted: 50 15% 65%; /* AAA290 - Couleur atténuée */
    --muted-foreground: 50 25% 35%; /* Plus foncé pour le contraste */

    --accent: 45 32% 46%; /* 9B8750 - Accent identique au primary */
    --accent-foreground: 45 100% 98%;

    --destructive: 0 84% 60%;
    --destructive-foreground: 45 100% 98%;

    --border: 50 15% 75%; /* Plus clair que AAA292 pour les bordures */
    --input: 50 15% 75%;
    --ring: 45 32% 46%; /* 9B8750 pour les focus states */

    --radius: 0.5rem;

    --sidebar-background: 0 0% 98%;

    --sidebar-foreground: 240 5.3% 26.1%;

    --sidebar-primary: 240 5.9% 10%;

    --sidebar-primary-foreground: 0 0% 98%;

    --sidebar-accent: 240 4.8% 95.9%;

    --sidebar-accent-foreground: 240 5.9% 10%;

    --sidebar-border: 220 13% 91%;

    --sidebar-ring: 217.2 91.2% 59.8%;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;

    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;

    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;

    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;

    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;

    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;

    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;

    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;

    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
    --sidebar-background: 240 5.9% 10%;
    --sidebar-foreground: 240 4.8% 95.9%;
    --sidebar-primary: 224.3 76.3% 48%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 240 3.7% 15.9%;
    --sidebar-accent-foreground: 240 4.8% 95.9%;
    --sidebar-border: 240 3.7% 15.9%;
    --sidebar-ring: 217.2 91.2% 59.8%;
  }
}

@layer base {
  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
  }
}