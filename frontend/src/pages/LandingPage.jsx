import React from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, Recycle, Users, ShoppingBag, Star } from "lucide-react";

const LandingPage = () => {
  const navigate = useNavigate();
  const { isSignedIn } = useUser();

  const handleCTA = (path) => {
    if (isSignedIn) {
      navigate(path);
    } else {
      navigate("/sign-in");
    }
  };

  const features = [
    {
      icon: <Recycle className="h-8 w-8 text-green-600" />,
      title: "Sustainable Fashion",
      description:
        "Reduce textile waste by giving clothes a second life through community exchanges.",
    },
    {
      icon: <Users className="h-8 w-8 text-blue-600" />,
      title: "Community Driven",
      description:
        "Connect with like-minded individuals who care about sustainable fashion choices.",
    },
    {
      icon: <ShoppingBag className="h-8 w-8 text-purple-600" />,
      title: "Points System",
      description:
        "Earn points for contributing items and redeem them for pieces you love.",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-50 to-blue-50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Welcome to <span className="text-green-600">ReWear</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join our community clothing exchange platform. Swap, redeem, and
              discover sustainable fashion while reducing textile waste.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => handleCTA("/items")}
                className="bg-green-600 hover:bg-green-700"
              >
                Start Swapping <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleCTA("/items")}
              >
                Browse Items
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleCTA("/add-item")}
              >
                List an Item
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose ReWear?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="flex justify-center mb-4">{feature.icon}</div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Our Impact</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">
                1000+
              </div>
              <div className="text-gray-600">Items Exchanged</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">500+</div>
              <div className="text-gray-600">Active Members</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">
                300+
              </div>
              <div className="text-gray-600">Successful Swaps</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600 mb-2">95%</div>
              <div className="text-gray-600">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-green-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Start Your Sustainable Fashion Journey?
          </h2>
          <p className="text-xl mb-8">
            Join thousands of users making a positive impact on the environment.
          </p>
          <Button
            size="lg"
            variant="outline"
            className="bg-white text-green-600 hover:bg-gray-100"
            onClick={() => handleCTA("/dashboard")}
          >
            Get Started Today
          </Button>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
