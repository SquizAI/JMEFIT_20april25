import React from 'react';
import { 
  TrendingUp, 
  FileText, 
  Zap, 
  HeadphonesIcon,
  Package,
  Calendar,
  Shield
} from 'lucide-react';

export function FeaturesSummary() {
  const remainingFeatures = [
    {
      id: 4,
      title: "Financial Reports & Analytics",
      icon: <TrendingUp className="w-6 h-6" />,
      status: "planned",
      components: [
        "MRR tracking dashboard",
        "Churn rate analysis",
        "Customer lifetime value calculator",
        "Payment failure reports",
        "Revenue forecasting",
        "Export to QuickBooks/Xero"
      ],
      tables: ["revenue_metrics", "payment_analytics", "churn_events"]
    },
    {
      id: 5,
      title: "Content Management System",
      icon: <FileText className="w-6 h-6" />,
      status: "planned",
      components: [
        "Rich text blog editor",
        "SEO metadata manager",
        "Image optimization pipeline",
        "Video content library",
        "Testimonial manager",
        "FAQ editor with categories"
      ],
      tables: ["blog_posts", "media_library", "testimonials", "faqs"]
    },
    {
      id: 6,
      title: "Automated Workflows",
      icon: <Zap className="w-6 h-6" />,
      status: "planned",
      components: [
        "Welcome email series builder",
        "Abandoned cart recovery",
        "Subscription renewal reminders",
        "Birthday/anniversary campaigns",
        "Re-engagement campaigns",
        "Post-purchase follow-ups"
      ],
      tables: ["automation_workflows", "workflow_triggers", "workflow_actions"]
    },
    {
      id: 7,
      title: "Customer Support Integration",
      icon: <HeadphonesIcon className="w-6 h-6" />,
      status: "planned",
      components: [
        "Ticket management system",
        "Live chat widget",
        "FAQ chatbot",
        "Response templates",
        "VIP priority queue",
        "Support metrics dashboard"
      ],
      tables: ["support_tickets", "chat_conversations", "response_templates"]
    },
    {
      id: 8,
      title: "Inventory & Fulfillment",
      icon: <Package className="w-6 h-6" />,
      status: "planned",
      components: [
        "Stock level tracking",
        "Low stock alerts",
        "Order fulfillment workflow",
        "Shipping label generation",
        "Return/refund management",
        "Supplier management"
      ],
      tables: ["inventory", "fulfillment_orders", "suppliers", "returns"]
    },
    {
      id: 9,
      title: "Advanced Scheduling",
      icon: <Calendar className="w-6 h-6" />,
      status: "planned",
      components: [
        "Recurring class scheduler",
        "Instructor assignment",
        "Capacity management",
        "Waitlist automation",
        "Calendar sync (Google/Apple)",
        "Automated reminders"
      ],
      tables: ["class_schedules", "instructor_availability", "class_bookings"]
    },
    {
      id: 10,
      title: "Security & Compliance",
      icon: <Shield className="w-6 h-6" />,
      status: "planned",
      components: [
        "Two-factor authentication",
        "Activity audit logs",
        "GDPR compliance tools",
        "Role-based access control",
        "IP whitelist",
        "PCI compliance monitoring"
      ],
      tables: ["audit_logs", "user_roles", "security_settings"]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-6">Upcoming Features Roadmap</h2>
        
        <div className="grid gap-6">
          {remainingFeatures.map((feature) => (
            <div 
              key={feature.id} 
              className="border dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  {feature.icon}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">{feature.title}</h3>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                      Planned
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Key Components:</h4>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        {feature.components.map((component, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-purple-600">•</span>
                            {component}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm mb-2">Database Tables:</h4>
                      <div className="flex flex-wrap gap-2">
                        {feature.tables.map((table, idx) => (
                          <code 
                            key={idx} 
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs"
                          >
                            {table}
                          </code>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <h3 className="font-semibold mb-2">Implementation Timeline</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            These features are planned for implementation over the next 3-6 months. 
            Priority will be given based on user feedback and business requirements.
          </p>
        </div>
      </div>
    </div>
  );
} 