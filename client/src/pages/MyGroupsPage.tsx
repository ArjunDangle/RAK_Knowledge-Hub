import { KnowledgeLayout } from "./KnowledgeLayout";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BookLock, Link as LinkIcon } from "lucide-react";
import { Link } from "react-router-dom";

export default function MyGroupsPage() {
    const { user } = useAuth();
    const breadcrumbs = [{ label: "My Groups" }];
    const userMemberships = user?.groupMemberships || [];

    return (
        <KnowledgeLayout breadcrumbs={breadcrumbs}>
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">My Groups</h1>
                    <p className="text-muted-foreground">
                        These are the permission groups you are a member of. Membership may grant you editing rights to certain sections of the knowledge hub.
                    </p>
                </div>

                {userMemberships.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {userMemberships.map((membership) => {
                            const group = membership.group;
                            return (
                                <Card key={group.id} className="flex flex-col">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Users className="h-5 w-5 text-primary" />
                                            {group.name}
                                            <span className="ml-auto text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground font-normal">
                                                {membership.role}
                                            </span>
                                        </CardTitle>
                                        <CardDescription>
                                            You are a member of this group.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-grow">
                                        <div className="text-sm p-4 rounded-md bg-muted/50">
                                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                                                <BookLock className="h-4 w-4" />
                                                Editing Permissions
                                            </h4>
                                            {group.managedPage ? (
                                                <p className="text-muted-foreground">
                                                    This group grants you permission to edit the content within the <strong className="text-foreground">"{group.managedPage.title}"</strong> section and all of its sub-pages.
                                                </p>
                                            ) : (
                                                <p className="text-muted-foreground italic">
                                                    No specific editing section is assigned to this group yet.
                                                </p>
                                            )}
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        {group.managedPage && (
                                            <Button asChild variant="outline" className="w-full">
                                                <Link to={`/page/${group.managedPage.confluenceId}`}>
                                                    <LinkIcon className="mr-2 h-4 w-4" />
                                                    Go to "{group.managedPage.title}" Section
                                                </Link>
                                            </Button>
                                        )}
                                    </CardFooter>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="text-center py-16 text-muted-foreground">
                            <Users className="h-12 w-12 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-foreground">No Group Memberships</h3>
                            <p>You are not currently a member of any permission groups.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </KnowledgeLayout>
    );
}