import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  Code2, 
  Briefcase, 
  Award, 
  Mail, 
  Phone, 
  Linkedin, 
  Instagram,
  ExternalLink,
  MapPin,
  GraduationCap,
  Sparkles,
  Home,
  ArrowLeft
} from "lucide-react";

export default function About() {
  const experience = [
    {
      title: "Full-Stack Developer Intern",
      company: "Keyan Technologies",
      period: "Jun 2025 – Jul 2025",
      description: "Built responsive Admin Dashboard UI using React, Vite, and MUI. Delivered production-ready components in a collaborative environment."
    },
    {
      title: "Client-Based Web Development",
      company: "Freelance",
      period: "2023 – Present",
      description: "Delivered 30+ websites including portfolios, landing pages, and business sites. Focused on responsive UI, SEO optimization, and performance."
    }
  ];

  const skills = {
    frontend: ["HTML5", "CSS3", "JavaScript", "React.js", "Tailwind CSS", "Bootstrap", "MUI"],
    backend: ["Node.js", "Express.js"],
    databases: ["MongoDB", "MySQL"],
    tools: ["Git", "GitHub", "Vite", "VS Code", "Figma", "Canva", "Firebase", "Vercel", "GoDaddy"]
  };

  const projects = [
    { name: "nationalhrfoundation.org", url: "https://nationalhrfoundation.org" },
    { name: "khansevents.com", url: "https://khansevents.com" },
    { name: "freezeenterprises.in", url: "https://freezeenterprises.in" },
    { name: "mindgrooveacademy.in", url: "https://mindgrooveacademy.in" },
    { name: "safeandstudyacademy.in", url: "https://safeandstudyacademy.in" },
    { name: "strawberryartistry.in", url: "https://strawberryartistry.in" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14 md:h-16">
            <Button variant="ghost" size="sm" asChild className="gap-2">
              <Link href="/">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Builder</span>
                <span className="sm:hidden">Back</span>
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
                <Code2 className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold">Teclanc.AI</span>
            </div>
            <Button variant="default" size="sm" asChild className="gap-2">
              <Link href="/">
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Home</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 py-12 md:py-20">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-4 border-primary/20 shadow-2xl">
                  <img 
                    src="https://raw.githubusercontent.com/lokeshsuryanarayanan/teclanc-website-builder/main/profile.jpg"
                    alt="Lokesh S - Creator of Teclanc.AI" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256' viewBox='0 0 256 256'%3E%3Crect width='256' height='256' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='system-ui' font-size='120' fill='%239ca3af'%3ELS%3C/text%3E%3C/svg%3E";
                    }}
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-3 shadow-lg">
                  <Sparkles className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Hero Content */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <Code2 className="w-4 h-4" />
                Creator of Teclanc.AI
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
                Lokesh S
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-6">
                Full-Stack Developer | MERN Stack Specialist
              </p>
              <div className="flex items-center justify-center lg:justify-start gap-2 text-muted-foreground mb-6">
                <MapPin className="w-5 h-5" />
                <span>Chennai, India</span>
              </div>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mb-8">
                Final-year Computer Science Engineering student and aspiring MERN Stack Developer with strong 
                experience in building responsive and scalable web applications. Delivered 30+ real-world client 
                websites with a focus on modern design and performance.
              </p>
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                <Button asChild>
                  <a href="mailto:teclancwebsolutions@gmail.com">
                    <Mail className="w-4 h-4 mr-2" />
                    Contact Me
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="https://teclanc.vercel.app" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Portfolio
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">About Teclanc.AI</h2>
          <Card className="p-6 md:p-8 bg-muted/30">
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Teclanc.AI was built to simplify website creation and help users convert ideas into functional 
              websites instantly. Leveraging the power of AI, this tool enables anyone—from beginners to 
              professionals—to generate production-ready HTML, CSS, and JavaScript code with just a simple 
              text prompt. The platform emphasizes clean code, responsive design, and rapid development.
            </p>
          </Card>
        </div>
      </section>

      {/* Experience Section */}
      <section className="bg-muted/30 border-y">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">Experience</h2>
          <div className="max-w-4xl mx-auto grid gap-6">
            {experience.map((exp, index) => (
              <Card key={index} className="p-6 md:p-8 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-1">{exp.title}</h3>
                    <p className="text-primary font-medium mb-2">{exp.company}</p>
                    <p className="text-sm text-muted-foreground mb-3">{exp.period}</p>
                    <p className="text-muted-foreground">{exp.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">Tech Stack</h2>
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Code2 className="w-5 h-5 text-primary" />
              Frontend
            </h3>
            <div className="flex flex-wrap gap-2">
              {skills.frontend.map((skill, i) => (
                <span key={i} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                  {skill}
                </span>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Code2 className="w-5 h-5 text-primary" />
              Backend
            </h3>
            <div className="flex flex-wrap gap-2">
              {skills.backend.map((skill, i) => (
                <span key={i} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                  {skill}
                </span>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Code2 className="w-5 h-5 text-primary" />
              Databases
            </h3>
            <div className="flex flex-wrap gap-2">
              {skills.databases.map((skill, i) => (
                <span key={i} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                  {skill}
                </span>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Code2 className="w-5 h-5 text-primary" />
              Tools
            </h3>
            <div className="flex flex-wrap gap-2">
              {skills.tools.slice(0, 6).map((skill, i) => (
                <span key={i} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                  {skill}
                </span>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* Projects Section */}
      <section className="bg-muted/30 border-y">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">Client Projects</h2>
          <div className="max-w-5xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project, index) => (
              <Card key={index} className="p-4 hover:shadow-lg transition-shadow">
                <a 
                  href={project.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 group"
                >
                  <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                    {project.name}
                  </span>
                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                </a>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <p className="text-muted-foreground">And many more...</p>
          </div>
        </div>
      </section>

      {/* Achievements Section */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">Achievements</h2>
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6">
          <Card className="p-6 text-center">
            <Award className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-3xl font-bold mb-2">30+</h3>
            <p className="text-muted-foreground">Client Projects Delivered</p>
          </Card>
          <Card className="p-6 text-center">
            <Award className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-3xl font-bold mb-2">Winner</h3>
            <p className="text-muted-foreground">National Tech Competitions</p>
          </Card>
          <Card className="p-6 text-center">
            <GraduationCap className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-3xl font-bold mb-2">Topper</h3>
            <p className="text-muted-foreground">Class & Symposium Leader</p>
          </Card>
        </div>
      </section>

      {/* Contact Section */}
      <section className="bg-gradient-to-b from-background to-primary/5 border-t">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">Get In Touch</h2>
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold mb-4 text-lg">Contact Information</h3>
                  <div className="space-y-4">
                    <a href="mailto:teclancwebsolutions@gmail.com" className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors">
                      <Mail className="w-5 h-5" />
                      <span className="text-sm">teclancwebsolutions@gmail.com</span>
                    </a>
                    <a href="tel:+918056052603" className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors">
                      <Phone className="w-5 h-5" />
                      <span className="text-sm">+91 80560 52603</span>
                    </a>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-4 text-lg">Social Links</h3>
                  <div className="space-y-4">
                    <a 
                      href="https://www.linkedin.com/in/lokesh-s-b018a424a/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Linkedin className="w-5 h-5" />
                      <span className="text-sm">LinkedIn Profile</span>
                    </a>
                    <a 
                      href="https://www.instagram.com/teclanclokesh" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Instagram className="w-5 h-5" />
                      <span className="text-sm">@teclanclokesh</span>
                    </a>
                  </div>
                </div>
              </div>
              <div className="mt-8 pt-8 border-t text-center">
                <p className="text-muted-foreground mb-4">Interested in collaboration or have a project in mind?</p>
                <Button size="lg" asChild>
                  <a href="mailto:teclancwebsolutions@gmail.com">
                    <Mail className="w-4 h-4 mr-2" />
                    Send a Message
                  </a>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
