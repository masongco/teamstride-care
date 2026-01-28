import { supabase } from '@/integrations/supabase/client';

interface NotifyReviewAssignedParams {
  employeeEmail: string;
  employeeName: string;
  reviewerName: string;
  reviewType: string;
  reviewId: string;
}

interface NotifySelfAssessmentDueParams {
  employeeEmail: string;
  employeeName: string;
  reviewId: string;
  dueDate?: string;
}

// Create notification for review assigned
export async function notifyReviewAssigned(params: NotifyReviewAssignedParams): Promise<boolean> {
  try {
    // First, we need to find the user_id for this employee
    // Since we can't query auth.users, we'll create a notification 
    // that uses an edge function or RPC to look up the user
    
    // For now, we'll use a workaround: query the user_roles table
    // which should have matching user_ids, or use the profiles table
    const { data: userData } = await supabase
      .from('profiles')
      .select('user_id')
      .ilike('display_name', `%${params.employeeName}%`)
      .maybeSingle();

    if (!userData?.user_id) {
      console.warn(`Could not find user_id for employee: ${params.employeeName}`);
      return false;
    }

    const reviewTypeName = params.reviewType === 'annual' ? 'Annual Review' 
      : params.reviewType === 'probation' ? 'Probation Review' 
      : 'Performance Review';

    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userData.user_id,
        title: 'New Review Assigned',
        message: `${params.reviewerName} has assigned you a ${reviewTypeName}. Please complete your self-assessment.`,
        type: 'review',
        category: 'performance',
        link: `/portal/reviews`,
        is_read: false,
      });

    if (error) throw error;
    return true;
  } catch (error: any) {
    console.error('Error creating review notification:', error.message);
    return false;
  }
}

// Create notification for self-assessment due
export async function notifySelfAssessmentDue(params: NotifySelfAssessmentDueParams): Promise<boolean> {
  try {
    const { data: userData } = await supabase
      .from('profiles')
      .select('user_id')
      .ilike('display_name', `%${params.employeeName}%`)
      .maybeSingle();

    if (!userData?.user_id) {
      console.warn(`Could not find user_id for employee: ${params.employeeName}`);
      return false;
    }

    const dueDateText = params.dueDate 
      ? ` by ${new Date(params.dueDate).toLocaleDateString()}`
      : ' soon';

    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userData.user_id,
        title: 'Self-Assessment Due',
        message: `Your self-assessment is due${dueDateText}. Please complete it to continue with your review.`,
        type: 'reminder',
        category: 'performance',
        link: `/portal/reviews`,
        is_read: false,
      });

    if (error) throw error;
    return true;
  } catch (error: any) {
    console.error('Error creating self-assessment notification:', error.message);
    return false;
  }
}

// Create notification for review status change
export async function notifyReviewStatusChange(params: {
  employeeEmail: string;
  employeeName: string;
  status: string;
  reviewId: string;
}): Promise<boolean> {
  try {
    const { data: userData } = await supabase
      .from('profiles')
      .select('user_id')
      .ilike('display_name', `%${params.employeeName}%`)
      .maybeSingle();

    if (!userData?.user_id) {
      return false;
    }

    let title = 'Review Updated';
    let message = 'Your review status has been updated.';

    switch (params.status) {
      case 'in_progress':
        title = 'Review In Progress';
        message = 'Your performance review is now in progress.';
        break;
      case 'pending_approval':
        title = 'Review Pending Approval';
        message = 'Your review is pending final approval.';
        break;
      case 'completed':
        title = 'Review Completed';
        message = 'Your performance review has been completed. View your feedback.';
        break;
    }

    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userData.user_id,
        title,
        message,
        type: 'review',
        category: 'performance',
        link: `/portal/reviews`,
        is_read: false,
      });

    if (error) throw error;
    return true;
  } catch (error: any) {
    console.error('Error creating status notification:', error.message);
    return false;
  }
}

// Create notification for 360 feedback request
export async function notifyFeedbackRequested(params: {
  responderEmail: string;
  responderName: string;
  employeeName: string;
  reviewId: string;
}): Promise<boolean> {
  try {
    const { data: userData } = await supabase
      .from('profiles')
      .select('user_id')
      .ilike('display_name', `%${params.responderName}%`)
      .maybeSingle();

    if (!userData?.user_id) {
      return false;
    }

    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userData.user_id,
        title: '360° Feedback Requested',
        message: `You've been asked to provide feedback for ${params.employeeName}'s performance review.`,
        type: 'feedback',
        category: 'performance',
        link: `/portal/reviews`,
        is_read: false,
      });

    if (error) throw error;
    return true;
  } catch (error: any) {
    console.error('Error creating feedback notification:', error.message);
    return false;
  }
}
