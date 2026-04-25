import supabase from '../config/supabase.js';

export function setupSocket(io) {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join team chat room
    socket.on('join_room', (projectId) => {
      socket.join(`project_${projectId}`);
      console.log(`Socket ${socket.id} joined project_${projectId}`);
    });

    // Leave room
    socket.on('leave_room', (projectId) => {
      socket.leave(`project_${projectId}`);
    });

    // Send group message
    socket.on('send_message', async (data) => {
      try {
        const { project_id, sender_id, content, type, file_url, file_name, mentions } = data;

        const { data: message, error } = await supabase
          .from('messages')
          .insert({ project_id, sender_id, content, type: type || 'text', file_url, file_name, mentions: mentions || [] })
          .select('*, sender:users!sender_id(full_name, avatar_url)')
          .single();

        if (error) throw error;

        io.to(`project_${project_id}`).emit('new_message', message);

        // Create notifications for mentioned users
        if (mentions && mentions.length > 0) {
          for (const userId of mentions) {
            await supabase.from('notifications').insert({
              user_id: userId,
              type: 'mention',
              title: 'You were mentioned',
              message: `${message.sender.full_name} mentioned you in a message`,
              link: `/chat`,
            });
          }
        }
      } catch (err) {
        console.error('Message send error:', err);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Private message
    socket.on('send_private_message', async (data) => {
      try {
        const { sender_id, receiver_id, content, type } = data;

        const { data: message, error } = await supabase
          .from('private_messages')
          .insert({ sender_id, receiver_id, content, type: type || 'text' })
          .select('*, sender:users!sender_id(full_name, avatar_url)')
          .single();

        if (error) throw error;

        // Emit to both users
        io.to(`user_${sender_id}`).emit('new_private_message', message);
        io.to(`user_${receiver_id}`).emit('new_private_message', message);

        // Notify receiver
        await supabase.from('notifications').insert({
          user_id: receiver_id,
          type: 'private_message',
          title: 'New Message',
          message: `${message.sender.full_name} sent you a message`,
          link: `/chat`,
        });
      } catch (err) {
        console.error('Private message error:', err);
      }
    });

    // Join user's personal room for private messages
    socket.on('register_user', (userId) => {
      socket.join(`user_${userId}`);
    });

    // Typing indicator
    socket.on('typing', (data) => {
      socket.to(`project_${data.project_id}`).emit('user_typing', {
        user_id: data.user_id,
        full_name: data.full_name,
      });
    });

    socket.on('stop_typing', (data) => {
      socket.to(`project_${data.project_id}`).emit('user_stop_typing', {
        user_id: data.user_id,
      });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
}
