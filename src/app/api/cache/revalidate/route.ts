import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    const secret = process.env.REVALIDATION_SECRET || "unlar_connect_super_secret_revalidation_token_2026";

    // Validate the authorization token
    if (authHeader !== `Bearer ${secret}`) {
      console.warn("[Cache Webhook] Unauthorized attempt to trigger revalidation.");
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const payload = await req.json();
    const { table, record, old_record, type } = payload;
    
    console.log(`[Cache Webhook] Received ${type} event on table: ${table}`);

    let revalidatedTags: string[] = [];

    // Parse the table change and map to corresponding cache tags
    switch (table) {
      case "users": {
        const userId = record?.id || old_record?.id;
        if (userId) {
          revalidatedTags.push(`user-profile-${userId}`);
          revalidatedTags.push(`dashboard-stats-${userId}`);
        }
        break;
      }
      case "tutoring_sessions": {
        const tutorId = record?.tutor_id || old_record?.tutor_id;
        const studentId = record?.student_id || old_record?.student_id;
        if (tutorId) revalidatedTags.push(`upcoming-sessions-${tutorId}`);
        if (studentId) revalidatedTags.push(`upcoming-sessions-${studentId}`);
        break;
      }
      case "tutor_availability": {
        const tutorId = record?.tutor_id || old_record?.tutor_id;
        if (tutorId) revalidatedTags.push(`tutor-availability-${tutorId}`);
        break;
      }
      case "tutor_subjects": {
        const tutorId = record?.tutor_id || old_record?.tutor_id;
        if (tutorId) {
          revalidatedTags.push(`tutor-subjects-${tutorId}`);
          revalidatedTags.push(`user-profile-${tutorId}`);
        }
        break;
      }
      case "posts": {
        revalidatedTags.push("forum-posts");
        revalidatedTags.push("recent-forum-posts");
        
        // If karma points changed, user's dashboard stats should also be revalidated
        const userId = record?.user_id || old_record?.user_id;
        if (userId) {
          revalidatedTags.push(`dashboard-stats-${userId}`);
        }
        break;
      }
      case "post_replies": {
        const postId = record?.post_id || old_record?.post_id;
        if (postId) {
          revalidatedTags.push(`post-replies-${postId}`);
        }
        revalidatedTags.push("forum-posts");
        revalidatedTags.push("recent-forum-posts");
        break;
      }
      case "documents": {
        revalidatedTags.push("resources");
        
        // Scoring/karma changes when uploading a resource
        const userId = record?.user_id || old_record?.user_id;
        if (userId) {
          revalidatedTags.push(`dashboard-stats-${userId}`);
        }
        break;
      }
      default:
        break;
    }

    // Call Next.js revalidateTag on each matched tag
    if (revalidatedTags.length > 0) {
      revalidatedTags.forEach(tag => {
        revalidateTag(tag);
        console.log(`[Cache Webhook] Successfully revalidated tag: ${tag}`);
      });
    }

    return NextResponse.json({
      success: true,
      revalidated: revalidatedTags,
      table,
      type,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("[Cache Webhook] Cache revalidation webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
