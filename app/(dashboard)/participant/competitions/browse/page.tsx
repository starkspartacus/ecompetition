"use client";

import type React from "react";
import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Calendar, MapPin, Users } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Competition {
  id: string;
  title: string;
  description: string;
  category: string;
  country: string;
  city: string;
  status: string;
  startDate: string;
  endDate: string;
  maxParticipants: number;
  currentParticipants: number;
  organizerId: string;
  uniqueCode: string;
}

const itemsPerPage = 6;

const CompetitionBrowsePage = () => {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchCompetitions = useCallback(
    async (page = 1, append = false) => {
      if (!append) setIsLoading(true);
      setError(null);

      try {
        let url = "/api/competitions/public";
        const params = new URLSearchParams();

        if (countryFilter && countryFilter !== "")
          params.append("country", countryFilter);
        if (categoryFilter && categoryFilter !== "")
          params.append("category", categoryFilter);
        if (statusFilter && statusFilter !== "")
          params.append("status", statusFilter);
        if (searchQuery) params.append("search", searchQuery);

        params.append("page", page.toString());
        params.append("limit", itemsPerPage.toString());

        if (params.toString()) {
          url += `?${params.toString()}`;
        }

        console.log("Fetching competitions from:", url);
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Erreur ${response.status}`);
        }

        const data = await response.json();

        if (append) {
          setCompetitions((prev) => [...prev, ...(data.competitions || [])]);
        } else {
          setCompetitions(data.competitions || []);
        }

        setTotalPages(Math.ceil((data.total || 0) / itemsPerPage));
        setHasMore(page < Math.ceil((data.total || 0) / itemsPerPage));

        console.log(
          `✅ Page ${page} chargée: ${
            data.competitions?.length || 0
          } compétitions`
        );
      } catch (error) {
        console.error("❌ Erreur:", error);
        setError(
          error instanceof Error ? error.message : "Une erreur est survenue"
        );
      } finally {
        setIsLoading(false);
      }
    },
    [searchQuery, countryFilter, categoryFilter, statusFilter]
  );

  useEffect(() => {
    fetchCompetitions();
  }, [fetchCompetitions]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchCompetitions(newPage);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
        return "bg-green-500";
      case "closed":
        return "bg-red-500";
      case "upcoming":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Browse Competitions</h1>
        <p className="text-muted-foreground">
          Discover and join exciting competitions
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search competitions..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-10"
          />
        </div>

        <Select value={countryFilter} onValueChange={setCountryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Countries</SelectItem>
            <SelectItem value="USA">USA</SelectItem>
            <SelectItem value="Canada">Canada</SelectItem>
            <SelectItem value="France">France</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Coding">Coding</SelectItem>
            <SelectItem value="Design">Design</SelectItem>
            <SelectItem value="Sports">Sports</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Open">Open</SelectItem>
            <SelectItem value="Closed">Closed</SelectItem>
            <SelectItem value="Upcoming">Upcoming</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading competitions...</span>
        </div>
      ) : error ? (
        <Alert className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <>
          {/* Competition Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {competitions.map((competition) => (
              <Card
                key={competition.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">
                      {competition.title}
                    </CardTitle>
                    <Badge className={getStatusColor(competition.status)}>
                      {competition.status}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {competition.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    {new Date(competition.startDate).toLocaleDateString()}
                  </div>

                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-2" />
                    {competition.city}, {competition.country}
                  </div>

                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="h-4 w-4 mr-2" />
                    {competition.currentParticipants}/
                    {competition.maxParticipants} participants
                  </div>

                  <Badge variant="outline">{competition.category}</Badge>
                </CardContent>

                <CardFooter>
                  <Button className="w-full" asChild>
                    <a href={`/participant/competitions/${competition.id}`}>
                      View Details
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
              >
                Previous
              </Button>

              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>

              <Button
                variant="outline"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CompetitionBrowsePage;
