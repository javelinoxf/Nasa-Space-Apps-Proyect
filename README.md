# Selene & Ares Explorer

An independent educational planetary mapping project for exploring lunar and Martian terrain and comparing selected terrestrial analog locations.

**Hosted application:** https://javelinoxf.github.io/Nasa-Space-Apps-Proyect/

## Project overview

The application provides interactive planetary map views, 3D globe visualizations, map layers, and selected Earth-analog comparison locations. Data availability and feature coverage depend on the source services used by each layer.

## Data references

The project uses or references public planetary science resources. Examples include:

- [NASA Solar System Treks](https://trek.nasa.gov/)
- [USGS Astrogeology Science Center](https://astrogeology.usgs.gov/)

Please consult the originating provider and the layer information in the application for authoritative dataset descriptions, licensing, resolution, and scientific limitations.

## Independence and affiliation

This is an independent educational project. It is **not an official NASA, USGS, or government website**, and it is not endorsed by those organizations. Names and links to NASA and USGS identify relevant data providers and resources.

## Source code

The source code for this project is maintained in this public GitHub repository:
https://github.com/javelinoxf/Nasa-Space-Apps-Proyect

## Local development

Requirements: Node.js and npm.

```bash
npm install
npm run build
npm run preview
```

The repository also contains an Electron desktop application. The Express API server is a separate runtime component; GitHub Pages serves the static frontend and does not run the Express server. Features that require API routes will need a separately deployed backend to work on the hosted site.

## License

No license is currently specified in this repository. Unless a license is added, reuse and redistribution are not granted by default.
