import React, {useState} from 'react';

// src/components/ProductFAQ.jsx
const faqByProductType = {
  Laptops: [
    {
      question:
        'What is the difference between a gaming laptop and a business laptop?',
      answer: `
  Gaming laptops are engineered for graphics-intensive workloads and prioritize high-end GPUs, advanced cooling systems, and often higher-refresh-rate displays (120 Hz and above) to deliver smooth frame rates in the latest titles. They tend to be heavier and thicker to accommodate powerful components and thermal solutions. Business laptops (sometimes called ultrabooks or professional laptops), on the other hand, focus on portability, battery endurance, and reliability.<br>
   You’ll find slimmer profiles, longer-lasting batteries (8–12 hours of mixed use), spill-resistant keyboards, and enterprise-grade security features such as TPM chips, fingerprint scanners, and optional smart-card readers. While a gaming laptop trades mobility for performance, a business model trades peak frame rates and RGB lighting for lightweight build, quiet operation, and secure remote-management capabilities.`,
    },
    {
      question: 'How does the CPU affect specific tasks?',
      answer: `
  The CPU—your system’s “brain”—executes all general computing instructions. For everyday tasks like web browsing, email, and document editing, a quad-core processor with moderate clock speeds (2.0–3.0 GHz base) is more than sufficient. When you dive into more demanding workloads—such as compiling large codebases, running multiple virtual machines, data analysis, or video transcoding—a higher core/thread count (6–8 cores or more) and higher turbo frequencies make a marked difference. More cores allow the CPU to juggle parallel tasks simultaneously, reducing build times in development environments or speeding up batch-export jobs in creative applications. Faster single-core performance improves responsiveness, so look for CPUs with a strong combination of core count and per-core speed for the best all-around experience.`,
    },
    {
      question: 'Why is the GPU important for performance?',
      answer: `
  The GPU (graphics processing unit) is specialized for parallel compute and rendering tasks. In gaming, a dedicated GPU with its own high-speed VRAM delivers higher frame rates, better visual detail, and support for features like real-time ray tracing. Beyond gaming, GPUs accelerate workloads such as 3D modeling, CAD, video editing (effects and encoding), and even machine-learning inference. An integrated GPU (built into the CPU) shares system memory and is fine for basic video playback and office graphics, but it cannot match the throughput of a discrete GPU when it comes to processing large textures, complex shaders, or parallel data streams. If your workflow involves any form of hardware-accelerated rendering or compute, a dedicated GPU can slash render times and provide smoother previews in creative software.`,
    },
    {
      question: 'What role does RAM play?',
      answer: `
  RAM (random-access memory) serves as the CPU and GPU’s short-term workspace, storing active data and instructions. When you open applications, load files, or browse the web, those assets are cached in RAM. If you run out of RAM, your system resorts to slower storage (SSD or HDD), causing noticeable lag and stuttering. For light productivity—email, spreadsheets, light web multitasking—8 GB may suffice. For heavier multitasking (20+ browser tabs, virtual machines, large Photoshop files) or professional apps (video editing, 3D rendering), 16–32 GB is recommended. Furthermore, on systems with integrated graphics, faster RAM speeds (e.g., 3200 MHz vs. 2666 MHz) can meaningfully improve graphical performance because the GPU draws from system memory.`,
    },
    {
      question: 'What is the difference between HDD, SSD, and NVMe storage?',
      answer: `
      <ul>
        <li>HDD (Hard Disk Drive) uses spinning magnetic platters and a read/write head—it's affordable with high capacities but much slower (100–150 MB/s) and more prone to mechanical failure.</li>
        
        <li>SSD (Solid State Drive) uses NAND flash chips with a SATA interface, delivering 5–10× the speed of an HDD (up to ~550 MB/s), no moving parts for greater durability, and lower power draw.</li>
        
        <li>NVMe (Non-Volatile Memory Express) is a protocol over PCIe lanes, allowing SSDs to reach 2–7× the speed of SATA-SSDs (1,500–3,500 MB/s+).</li>
        </ul>
        NVMe drives offer the highest throughput and lowest latency, ideal for heavy workloads like video editing or large file transfers.
        `,
    },
    {
      question: 'How do screen sizes impact usability?',
      answer: `
        Laptop screens typically range from 13″ to 17″ diagonally, each offering different trade-offs. 
        <ul>
        <li>13″–14″: Highly portable and lightweight (sub-1.3 kg), ideal for frequent travelers and students, but less screen real estate for side-by-side windows.  </li>
        <li>15″: The most popular compromise, delivering a comfortable balance between productivity space and manageable weight (around 1.6–2.0 kg).  </li>
        <li>16″–17″: Suited for gaming, content creation, or detailed work, offering expansive workspace and often higher resolutions, but add bulk and reduce battery life due to larger backlights.  </li>
        </ul>
        Also consider resolution (Full HD, QHD, 4K), panel type (IPS for color accuracy, OLED for contrast), and refresh rate (60 Hz vs. 120/144 Hz+) based on your priorities.`,
    },
    {
      question: 'What warranty coverage applies?',
      answer: `
        Standard laptops include a one-year manufacturer warranty covering defects in materials and workmanship, effective from the delivery date. This warranty typically covers hardware failures not caused by user damage. Some models offer extended-warranty plans (two or three years), such extended warranties will always be stated in the top section of the product page. Warranty claims generally require a valid proof of purchase and the device’s serial number.`,
    },
    {
      question: 'Are VAT charges included in the price?',
      answer: `
        All displayed laptop prices include Value-Added Tax (VAT) by default, unless explicitly noted otherwise on the product page. Any additional fees—such as shipping, or handling will be clearly itemized during checkout. If a product is VAT-exempt, that exception will be stated alongside the price.`,
    },
  ],
  'Mobile Phones': [
    {
      question: 'What battery life can I expect from this smartphone?',
      answer: `
        Most modern smartphones feature batteries between 3 000 mAh and 5 000 mAh. Under mixed use (calls, browsing, streaming, light gaming), you can expect 10–18 hours of runtime. Heavy tasks—like GPS navigation or 3D gaming—will shorten that considerably. Battery life also depends on screen brightness, background apps, and network conditions.`,
    },
    {
      question: 'How much storage do I need and is it expandable?',
      answer: `
        Storage tiers commonly start at 64 GB and go up to 512 GB or more. If you store lots of photos, videos, or games, aim for 128 GB+. Some phones support microSD cards (up to 1 TB) for extra space; others offer dual-SIM trays with a hybrid slot where one SIM can be swapped for a card.`,
    },
    {
      question: 'What should I know about the camera system?',
      answer: `
        Smartphones often combine multiple lenses: wide, ultra-wide, and telephoto. Sensor size and pixel size affect low-light performance, while aperture (f-number) controls depth of field. Look for features like optical image stabilization (OIS), phase-detect autofocus (PDAF), and software modes (night, portrait). More megapixels don’t always mean better pictures—sensor quality and image processing matter most.`,
    },
    {
      question: 'Which network bands and connectivity options are supported?',
      answer: `
        Most phones cover GSM, LTE bands (e.g., B3, B7, B20 in Lebanon) and increasingly 5G n78. They also include Wi-Fi 5/6, Bluetooth 5.x, NFC for contactless payments, and GPS/GLONASS/Galileo for mapping. Always check the “Specs” tab for exact band support to ensure compatibility with your carrier.`,
    },
    {
      question: 'How are software updates and OS support handled?',
      answer: `
        iOS devices generally receive major OS updates for 5+ years, while Android models promise 2–3 years of OS updates plus 3–4 years of security patches. After that window, security risks increase. If longevity is critical, verify the update policy on the product page before buying.`,
    },
    {
      question: 'Does this phone support fast charging or wireless charging?',
      answer: `
        Fast-charge rates vary—commonly 18 W to 65 W—reaching 50% battery in 20–30 minutes. Some phones also offer wireless charging (Qi standard) at 7.5 W–15 W, plus reverse wireless charging to top up accessories. Chargers may be sold separately—check the “In the box” section.`,
    },
    {
      question: 'What SIM configurations are available (dual-SIM, eSIM)?',
      answer: `
        Many phones support dual-SIM via two nano-SIM slots or one nano-SIM + eSIM. eSIM lets you activate a carrier plan digitally without a physical card. Hybrid trays force a choice between a second SIM or memory card if you need expandable storage.`,
    },
    {
      question: 'Is this phone water- and dust-resistant?',
      answer: `
        Look for an IP rating, like IP67 (dust-tight, 1 m water for 30 min) or IP68 (dust-tight, 1.5 m+ water). That rating ensures protection against accidental spills, rain, and brief submersion.`,
    },
    {
      question:
        'What is the difference between LCD, OLED, and AMOLED displays?',
      answer: `
          <ul>
              <li>LCD (IPS) panels use a backlight behind liquid crystals; they offer accurate colors and wide viewing angles but can’t produce true blacks.  </li>
              <li>OLED panels light each pixel independently, giving perfect blacks and high contrast, but can suffer burn-in over many years.  </li>
              <li>AMOLED is a variation of OLED with faster refresh and lower power draw on dark content. All deliver vibrant colors—just trade off contrast, power efficiency, and longevity.</li>
          </ul
          `,
    },
    {
      question: 'What warranty coverage applies?',
      answer: `
        Smartphones include a Limited Manufacturer warranty against defects in materials and workmanship. So unless stated otherwise, the warranty only covers manufacturing defects.`,
    },
    {
      question: 'Are VAT charges included in the price?',
      answer: `
        All smartphone prices include VAT by default; any VAT-exclusive pricing will be clearly noted on the individual product page. Additional fees, like shipping, are itemized at checkout.`,
    },
  ],
  'Monitors & Smart Display': [
    {
      question: 'What panel types are available and how do they differ?',
      answer: `
      <ul>
        <li>IPS (In-Plane Switching): Offers the widest viewing angles and the most accurate color reproduction, making it ideal for photo/video editing and general productivity.  </li>
        <li>VA (Vertical Alignment): Delivers higher contrast ratios and deeper blacks than IPS but with narrower viewing angles; great for media consumption.  </li>
        <li>TN (Twisted Nematic): Typically the fastest in response time, often used in budget or esports-focused models, but with more limited color and viewing angles.</li>
      </ul>`,
    },
    {
      question: 'Which resolutions and aspect ratios should I consider?',
      answer: `
      <ul>
<li>Common resolutions include Full HD (1920×1080), QHD (2560×1440), and 4K UHD (3840×2160).  </li>
<li>Aspect ratios are usually 16:9 (standard widescreen) or 21:9 (ultrawide).  </li>
<li>Higher resolutions give sharper text and more workspace, while ultrawide screens let you view multiple windows side by side without a multi-monitor setup.</li>
</ul>`,
    },
    {
      question: 'How do refresh rate and response time impact performance?',
      answer: `
      <ul>
<li>Refresh rate (60 Hz–240 Hz+) determines how many times per second the display redraws—higher rates yield smoother motion in gaming and scrolling.  </li>
<li>Response time (1–8 ms) is how quickly a pixel changes color; lower values reduce motion blur in fast-moving scenes.  </li>
<li>If you don’t play fast-paced games, a 60–75 Hz, 4–5 ms monitor is usually sufficient.</li>
</ul>`,
    },
    {
      question: 'What is HDR and why might I need it?',
      answer: `
      <ul>
<li>HDR (High Dynamic Range) enables a wider range between the darkest and brightest parts of an image for more lifelike contrast and color.  </li>
<li>Look for a VESA DisplayHDR certification (e.g., 400, 600) to ensure true HDR performance.  </li>
<li>HDR is most beneficial for HDR-enabled video content and gaming that supports it.</li>
</ul>`,
    },
    {
      question: 'Which connectivity ports are supported?',
      answer: `
      <ul>
<li>Most monitors include a combination of HDMI and DisplayPort—HDMI is ubiquitous, while DisplayPort often supports higher refresh rates/resolutions.  </li>
<li>You may also find USB-C (with DisplayPort Alt Mode and Power Delivery), USB-A downstream ports, and a 3.5 mm audio jack.  </li>
<li>Check the “Specs” tab to confirm compatibility with your PC or laptop.</li>
</ul>`,
    },
    {
      question: 'Do these monitors include built-in speakers or USB hubs?',
      answer: `
Some models feature integrated stereo speakers—convenient but generally lower fidelity than external speakers.  
Many professional and ultrawide monitors include a USB hub (USB-A or USB-C) to connect peripherals directly through the monitor for cleaner cable management.`,
    },
    {
      question: 'What mounting and stand adjustability options are available?',
      answer: `
Look for VESA 75×75 or 100×100 compatibility if you plan to use a wall or arm mount.  
Factory stands may offer tilt, swivel, pivot (portrait mode), and height adjustment—handy for ergonomic setups.`,
    },
    {
      question: 'How do brightness and contrast ratio affect image quality?',
      answer: `
Brightness (measured in nits) affects visibility in bright rooms; 250–350 nits is standard, while 400+ is better for HDR.  
Contrast ratio (e.g., 1000:1) is the brightness difference between white and black; higher ratios yield deeper blacks and more vivid images.`,
    },
    {
      question: 'What is color gamut and why is calibration important?',
      answer: `
      <ul>
<li>Color gamut (sRGB, Adobe RGB, DCI-P3) indicates the range of displayable colors.  </li>
<li>Monitors covering 99%+ of sRGB are fine for general use; wider gamuts suit photo/video professionals.  </li>
<li>Calibration (via software or hardware calibrator) ensures color accuracy, crucial for content creation.</li>
</ul>`,
    },
    {
      question: 'How much power do these monitors consume?',
      answer: `
      <ul>
<li>Typical power draw ranges from 20 W (small/IPS models) to 50 W+ (large/4K/HDR monitors).  </li>
<li>Energy-saving modes and automatic brightness adjustment can reduce usage.  </li>
<li>Check the energy-star or EPEAT rating for efficiency details.</li>
</ul>`,
    },
    {
      question: 'What warranty coverage applies?',
      answer: `
All monitors include a one-year manufacturer warranty covering defects in materials and workmanship, unless an extended plan (two- or three-year) is explicitly offered on the product page.`,
    },
    {
      question: 'Are VAT charges included in the price?',
      answer: `
All monitor prices include VAT (value-added tax) by default; any VAT-exclusive pricing will be clearly noted on the individual product page.`,
    },
  ],
};

export default function ProductFAQ({productType}) {
  const [openIndex, setOpenIndex] = useState(null);
  const faqs = faqByProductType[productType] || [];
  if (!faqs.length) return null;

  const handleClick = (idx) => setOpenIndex(openIndex === idx ? null : idx);

  return (
    <section className="product-faq">
      <h2>Frequently Asked Questions</h2>
      <div className="faq-list">
        {faqs.map((item, idx) => (
          <div
            key={idx}
            className={`faq-item ${openIndex === idx ? 'open' : ''}`}
          >
            <h3 className="faq-question" onClick={() => handleClick(idx)}>
              {item.question}
            </h3>
            <div className="faq-answer-wrapper">
              <div
                className="faq-answer"
                dangerouslySetInnerHTML={{__html: item.answer}}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
