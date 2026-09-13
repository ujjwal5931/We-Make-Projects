import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // ─── Admin User ────────────────────────────────────────────────────────────
  const adminUserId = process.env.ADMIN_USER_ID || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";
  const adminEmail = process.env.ADMIN_EMAIL || "admin@wemakeprojects.com";
  const adminName = process.env.ADMIN_NAME || "Admin User";

  const adminHash = await bcrypt.hash(adminPassword, 12);
  const admin = await prisma.user.upsert({
    where: { userId: adminUserId },
    update: { passwordHash: adminHash },
    create: {
      userId: adminUserId,
      passwordHash: adminHash,
      name: adminName,
      email: adminEmail,
      phone: "+91-9999999999",
      role: "ADMIN",
    },
  });
  console.log(`✅ Admin user: ${adminUserId}`);

  // ─── Demo Customer ──────────────────────────────────────────────────────────
  const customerHash = await bcrypt.hash("customer123", 12);
  const customer = await prisma.user.upsert({
    where: { userId: "student_arjun" },
    update: {},
    create: {
      userId: "student_arjun",
      passwordHash: customerHash,
      name: "Arjun Mehta",
      email: "arjun@example.com",
      phone: "+91-9876543210",
      role: "CUSTOMER",
    },
  });
  console.log(`✅ Demo customer: student_arjun / customer123`);

  // ─── Store Settings ─────────────────────────────────────────────────────────
  const settings = [
    { key: "store_name", value: "We Make Projects", description: "Store display name" },
    { key: "contact_email", value: "support@wemakeprojects.com", description: "Support email" },
    { key: "support_phone", value: "+91-9999999999", description: "WhatsApp/phone for support" },
    { key: "currency", value: "INR", description: "Default currency" },
    { key: "store_description", value: "Digital engineering resources for students", description: "Store tagline" },
    { key: "max_screenshot_size_mb", value: "5", description: "Max payment screenshot size in MB" },
  ];

  for (const s of settings) {
    await prisma.storeSettings.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }
  console.log("✅ Store settings");

  // ─── Categories ────────────────────────────────────────────────────────────
  const categories = [
    { name: "SolidWorks CAD Files", slug: "solidworks-cad-files", description: "Professional SolidWorks CAD assemblies and parts for engineering projects" },
    { name: "ANSYS Simulation Files", slug: "ansys-simulation-files", description: "Thermal, structural, and CFD simulation projects in ANSYS Workbench" },
    { name: "Engineering Notes", slug: "engineering-notes", description: "Comprehensive notes and study materials for engineering subjects" },
    { name: "Software Installation Files", slug: "software-installation-files", description: "Engineering software installers and setup guides" },
    { name: "Other Digital Products", slug: "other-digital-products", description: "Other useful digital resources for engineering students" },
  ];

  const createdCategories: Record<string, string> = {};
  for (const cat of categories) {
    const c = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { ...cat, isActive: true },
    });
    createdCategories[cat.slug] = c.id;
  }
  console.log("✅ Categories");

  // ─── Payment QRs ────────────────────────────────────────────────────────────
  const qr1 = await prisma.paymentQR.upsert({
    where: { id: "qr-demo-1" },
    update: {},
    create: {
      id: "qr-demo-1",
      name: "We Make Projects Main",
      qrImageUrl: "/images/demo-qr.png",
      upiId: "wemakeprojects@upi",
      accountName: "We Make Projects",
      isActive: true,
    },
  });
  console.log("✅ Demo QR code");

  // ─── Products ──────────────────────────────────────────────────────────────
  const products = [
    {
      name: "Mechanical Gear Assembly — SolidWorks CAD Project",
      slug: "mechanical-gear-assembly-solidworks",
      description: "A complete SolidWorks CAD assembly of a mechanical gear system suitable for mechanical engineering final year projects. Includes spur gears, helical gears, shaft assembly, and housing components. All parts are fully parametric and can be modified for your specific requirements.",
      shortDescription: "Complete SolidWorks gear assembly with 15+ components, fully parametric design.",
      price: 999,
      discountPrice: 699,
      categorySlug: "solidworks-cad-files",
      fileType: ".SLDASM / .SLDPRT",
      fileSize: "45 MB",
      numberOfPages: null,
      features: ["15+ fully modeled components", "Parametric design", "Includes BOM", "Exploded view", "Engineering drawings included", "Compatible with SW 2019+"],
      requirements: ["SolidWorks 2019 or later", "Minimum 4GB RAM", "Windows 7/10/11"],
      whatsIncluded: ["Main assembly file (.SLDASM)", "Individual part files (.SLDPRT)", "Engineering drawings (.SLDDRW)", "Bill of Materials (Excel)", "Project report (PDF)", "README.txt"],
      tags: ["solidworks", "gear", "assembly", "mechanical", "CAD"],
      isFeatured: true,
      previewUrl: null,
    },
    {
      name: "Thermal Analysis of Heat Exchanger — ANSYS Workbench",
      slug: "heat-exchanger-thermal-analysis-ansys",
      description: "Complete ANSYS Workbench project for thermal analysis of a shell-and-tube heat exchanger. Includes geometry setup, meshing strategy, boundary conditions, and post-processing results. Ideal for mechanical/chemical engineering projects.",
      shortDescription: "ANSYS thermal simulation of shell-and-tube heat exchanger with full results.",
      price: 1299,
      discountPrice: 899,
      categorySlug: "ansys-simulation-files",
      fileType: ".wbpj / .mechdat",
      fileSize: "120 MB",
      numberOfPages: null,
      features: ["Full thermal simulation setup", "Convergence data included", "Temperature contour plots", "Velocity field results", "Mesh quality report", "Compatible with ANSYS 2020+"],
      requirements: ["ANSYS Workbench 2020 R1 or later", "Minimum 8GB RAM", "Windows 10/11"],
      whatsIncluded: ["ANSYS project file (.wbpj)", "Geometry file (.STEP)", "Mesh file", "Results summary (PDF)", "Project report (DOCX)", "Screenshots folder"],
      tags: ["ansys", "thermal", "heat exchanger", "simulation", "CFD", "mechanical"],
      isFeatured: true,
      previewUrl: null,
    },
    {
      name: "Structural Analysis of Truss Bridge — ANSYS Static",
      slug: "truss-bridge-structural-analysis-ansys",
      description: "ANSYS static structural analysis of a steel truss bridge under various load conditions. Includes stress analysis, deformation analysis, and factor of safety calculations. Perfect for civil/structural engineering projects.",
      shortDescription: "Static structural analysis of truss bridge with stress and deformation results.",
      price: 1199,
      discountPrice: 849,
      categorySlug: "ansys-simulation-files",
      fileType: ".wbpj / .mechdat",
      fileSize: "85 MB",
      numberOfPages: null,
      features: ["Multiple load case analysis", "Von Mises stress plots", "Total deformation results", "Safety factor analysis", "Material property setup", "ANSYS 2019+ compatible"],
      requirements: ["ANSYS Mechanical 2019 or later", "8GB RAM recommended", "Windows 10"],
      whatsIncluded: ["ANSYS project archive", "Load case documentation", "Results report (PDF)", "Screenshots folder"],
      tags: ["ansys", "structural", "bridge", "truss", "civil", "FEA"],
      isFeatured: false,
      previewUrl: null,
    },
    {
      name: "Fluid Mechanics Complete Notes — B.Tech",
      slug: "fluid-mechanics-notes-btech",
      description: "Comprehensive handwritten-style notes for Fluid Mechanics covering all major topics from basic concepts to advanced fluid flow analysis. Prepared by engineering faculty with exam-oriented approach. Includes solved examples and previous year questions.",
      shortDescription: "Complete B.Tech Fluid Mechanics notes — 180+ pages with solved examples.",
      price: 299,
      discountPrice: 199,
      categorySlug: "engineering-notes",
      fileType: ".PDF",
      fileSize: "28 MB",
      numberOfPages: 185,
      features: ["180+ pages comprehensive coverage", "Exam-oriented approach", "Solved numerical examples", "Previous year questions", "Formula sheet included", "High-quality PDF"],
      requirements: ["PDF reader (Adobe Acrobat / any PDF app)", "A4 print-ready format"],
      whatsIncluded: ["Main notes PDF (180+ pages)", "Formula quick reference (PDF)", "Practice problems with solutions"],
      tags: ["fluid mechanics", "notes", "btech", "mechanical", "civil", "PDF"],
      isFeatured: true,
      previewUrl: null,
    },
    {
      name: "Thermodynamics Engineering Notes — Complete",
      slug: "thermodynamics-notes-complete",
      description: "Complete engineering thermodynamics notes covering all topics: laws of thermodynamics, entropy, steam tables, refrigeration cycles, and power cycles. Includes diagrams, worked examples, and summary tables.",
      shortDescription: "Complete thermodynamics notes with diagrams and 150+ solved examples.",
      price: 349,
      discountPrice: 249,
      categorySlug: "engineering-notes",
      fileType: ".PDF",
      fileSize: "22 MB",
      numberOfPages: 200,
      features: ["200+ pages", "Color diagrams & charts", "150+ solved numericals", "Steam tables included", "Refrigeration & power cycles", "GTU/SPPU syllabus aligned"],
      requirements: ["PDF reader"],
      whatsIncluded: ["Main notes PDF", "Steam tables PDF", "Formula handbook"],
      tags: ["thermodynamics", "notes", "mechanical", "PDF", "btech"],
      isFeatured: false,
      previewUrl: null,
    },
    {
      name: "AutoCAD 2024 — Full Installation Package (Windows)",
      slug: "autocad-2024-installation-windows",
      description: "Complete AutoCAD 2024 installation guide and setup package for Windows. Includes step-by-step installation instructions, license activation guide, and troubleshooting tips. Note: This package contains the installer and activation tools only.",
      shortDescription: "AutoCAD 2024 installer + step-by-step activation guide for Windows.",
      price: 499,
      discountPrice: 349,
      categorySlug: "software-installation-files",
      fileType: ".ZIP",
      fileSize: "4.2 GB",
      numberOfPages: null,
      features: ["AutoCAD 2024 full version", "Step-by-step installation guide", "Offline activation", "Windows 10/11 compatible", "Technical support via email"],
      requirements: ["Windows 10 or 11 (64-bit)", "8GB RAM minimum (16GB recommended)", "10GB free disk space", "Internet connection for initial setup"],
      whatsIncluded: ["Installation package (ZIP)", "Activation guide (PDF)", "Troubleshooting FAQ", "Installation video link"],
      tags: ["autocad", "software", "CAD", "windows", "installation"],
      isFeatured: true,
      previewUrl: null,
    },
    {
      name: "MATLAB R2023b — Student Installation Guide",
      slug: "matlab-r2023b-student-guide",
      description: "Complete MATLAB R2023b student installation package with all required toolboxes. Includes Simulink, Control System Toolbox, Signal Processing Toolbox, and more. Step-by-step guide included.",
      shortDescription: "MATLAB R2023b with Simulink + 10 toolboxes installation guide.",
      price: 599,
      discountPrice: 399,
      categorySlug: "software-installation-files",
      fileType: ".ZIP",
      fileSize: "6.8 GB",
      numberOfPages: null,
      features: ["MATLAB R2023b full installation", "Simulink included", "10+ toolboxes", "Offline license activation", "Student license compatible"],
      requirements: ["Windows 10/11 or macOS Monterey+", "8GB RAM (16GB recommended)", "20GB free disk space"],
      whatsIncluded: ["MATLAB installer (ZIP)", "Toolbox activation files", "Installation guide PDF", "Getting started tutorial"],
      tags: ["matlab", "simulink", "software", "engineering", "installation"],
      isFeatured: false,
      previewUrl: null,
    },
    {
      name: "IC Engine 3D Model — Piston Cylinder Assembly SolidWorks",
      slug: "ic-engine-piston-cylinder-solidworks",
      description: "Detailed 3D model of a single-cylinder IC engine piston-cylinder assembly in SolidWorks. Includes animated assembly motion study, fully parametric parts, and engineering drawings. Great for mechanical/automobile engineering projects.",
      shortDescription: "IC Engine piston assembly with motion animation study in SolidWorks.",
      price: 799,
      discountPrice: 549,
      categorySlug: "solidworks-cad-files",
      fileType: ".SLDASM / .SLDPRT",
      fileSize: "38 MB",
      numberOfPages: null,
      features: ["Single-cylinder IC engine model", "Motion animation study", "Fully parametric", "Exploded view included", "SW 2020+ compatible", "Drawings included"],
      requirements: ["SolidWorks 2020 or later", "4GB RAM minimum"],
      whatsIncluded: ["Assembly file (.SLDASM)", "Part files (.SLDPRT)", "Motion study file", "Engineering drawings (.SLDDRW)", "Project report (PDF)"],
      tags: ["solidworks", "IC engine", "piston", "automobile", "mechanical", "3D model"],
      isFeatured: false,
      previewUrl: null,
    },
  ];

  for (const p of products) {
    const { categorySlug, features, requirements, whatsIncluded, tags, ...productData } = p;
    const categoryId = createdCategories[categorySlug];
    if (!categoryId) continue;

    const existing = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (!existing) {
      const product = await prisma.product.create({
        data: {
          ...productData,
          categoryId,
          // JSON-encode arrays for SQLite compatibility
          features: JSON.stringify(features),
          requirements: JSON.stringify(requirements),
          whatsIncluded: JSON.stringify(whatsIncluded),
          tags: JSON.stringify(tags),
          isActive: true,
          digitalFileKey: `demo-${p.slug}.zip`,
          digitalFileProvider: "local",
          paymentQR: {
            create: { qrId: qr1.id },
          },
        },
      });
      console.log(`  ✅ Product: ${p.name}`);
    } else {
      console.log(`  ⏩ Product already exists: ${p.name}`);
    }
  }

  // ─── Demo Reviews ──────────────────────────────────────────────────────────
  const firstProduct = await prisma.product.findFirst({ where: { slug: "mechanical-gear-assembly-solidworks" } });
  if (firstProduct) {
    const existingReview = await prisma.review.findFirst({
      where: { userId: customer.id, productId: firstProduct.id },
    });
    if (!existingReview) {
      await prisma.review.create({
        data: {
          productId: firstProduct.id,
          userId: customer.id,
          rating: 5,
          title: "Excellent CAD project! Very detailed.",
          comment: "The gear assembly is incredibly detailed and well-structured. Saved me a lot of time for my final year project. The engineering drawings are also included which is a bonus. Highly recommended for mechanical engineering students.",
          isVisible: true,
        },
      });
      console.log("✅ Demo review");
    }
  }

  console.log("\n🎉 Seed completed successfully!");
  console.log("\nDemo Credentials:");
  console.log(`  Admin: ${adminUserId} / ${adminPassword}`);
  console.log("  Customer: student_arjun / customer123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
